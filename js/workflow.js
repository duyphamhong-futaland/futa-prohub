/* ============================================================
   FUTA Land — Prohub  ·  workflow.js
   State-machine giao dịch: vòng "Đặt chỗ → Đăng ký → Kiểm duyệt →
   Cọc → Hợp đồng → Thu tiền". Mỗi hành động: kiểm quyền → đổi trạng
   thái sản phẩm → tạo/cập nhật phiếu liên kết → ghi lịch sử + thông báo.
   ============================================================ */
const Workflow = (function(){

  const now = ()=> new Date().toLocaleString("vi-VN");
  /* chặn quyền ngay tại tầng logic (không chỉ ẩn nút ở UI) */
  function deny(cap){ return (typeof Perm!=="undefined" && !Perm.can(cap)) ? err("Bạn không có quyền thực hiện thao tác này") : null; }
  function ensureCustomer(st, name, extra){
    let c = st.customers.find(x=>x.name===name);
    if(!c){ c = Object.assign({id:"C"+(st.customers.length+1)+"_"+Date.now().toString(36), name}, extra||{}); st.customers.push(c); }
    return c;
  }

  /* Hành động "xuôi dòng" theo trạng thái (đặt chỗ/đăng ký/thu hồi do
     panel hàng đợi xử lý — xem queuePanelHTML). */
  function nextActions(p){
    const A = [];
    const can = (c)=> typeof Perm==="undefined" || Perm.can(c);
    switch(p.status){
      case "chua_mo_ban":
        if(can("price.publish")) A.push({key:"publish", label:"Công bố giá", cls:"btn-primary"});
        break;
      case "dang_ky":
        if(can("contract.manage")) A.push({key:"check", label:"Đủ hồ sơ → Kiểm tra", cls:"btn-primary"});
        break;
      case "kiem_tra":
        if(can("contract.manage")) A.push({key:"kdreview", label:"KD kiểm duyệt", cls:"btn-primary"});
        break;
      case "cho_duyet":
        if(can("accounting.approve")) A.push({key:"confirmcoc", label:"Kế toán xác nhận cọc", cls:"btn-primary"});
        break;
      case "da_coc":
        if(can("contract.manage")) A.push({key:"createmb", label:"Tạo HĐ Mua bán", cls:"btn-primary"});
        if(can("contract.transfer")) A.push({key:"transfer", label:"🔁 Chuyển nhượng", cls:"btn-ghost"});
        if(can("refund.create")) A.push({key:"refund", label:"↩ Hủy & hoàn tiền", cls:"btn-ghost"});
        if(can("liquidation")) A.push({key:"liquidate", label:"📄 Thanh lý", cls:"btn-ghost"});
        break;
      case "hop_dong":
        if(can("contract.transfer")) A.push({key:"transfer", label:"🔁 Chuyển nhượng", cls:"btn-ghost"});
        if(can("liquidation")) A.push({key:"liquidate", label:"📄 Thanh lý", cls:"btn-ghost"});
        break;
    }
    return A;
  }

  /* 1) Công bố giá: chua_mo_ban → mo_ban */
  function publish(ma){
    {const _d=deny('price.publish');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      p.status = "mo_ban"; p.congKhaiGia = true;
      Store.pushHistory(p, "Công bố giá → Đang mở bán");
      Store.notify(`Công bố giá căn ${ma}`);
      return ok("Đã công bố giá "+ma);
    });
  }

  /* 2) Đặt chỗ → VÀO HÀNG ĐỢI (Ưu Tiên 1/2/3). Claim đầu tiên giữ chỗ
        và bắt đầu đếm giờ; claim sau xếp ưu tiên kế tiếp. */
  function book(ma, d){
    {const _d=deny('booking');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      if(["mo_ban","giu_cho","dang_ky"].indexOf(p.status)<0) return err("Căn không nhận đặt chỗ ở trạng thái hiện tại");
      p.queue = p.queue || [];
      if(p.queue.length >= CFG.QUEUE.maxPriority) return err("Hàng đợi đã đầy ("+CFG.QUEUE.maxPriority+" ưu tiên)");
      if(p.queue.some(c=>c.dvbh===d.dvbh && c.kh===d.kh)) return err("Khách/ĐVBH này đã ở trong hàng đợi");
      const c = ensureCustomer(st, d.kh, {phone:d.sdt, cccd:d.cccd});
      const code = Store.nextCode("ycdch","Test-YCDCH-",5);
      st.ycdch.unshift({ma:code, productMa:ma, erp:"", pt:"", ttpt:"", tien:"",
        customerId:c.id, kh:d.kh, sdt:d.sdt||c.phone||"", cccd:d.cccd||c.cccd||"",
        tvv:d.tvv||"", san:d.dvbh||"", dvbh:d.dvbh||"", tg:now(), status:"cho_xn"});
      p.queue.push({id:'q'+Date.now().toString(36)+Math.floor(Math.random()*1e3), ycdchMa:code,
        customerId:c.id, kh:d.kh, sdt:d.sdt||"", dvbh:d.dvbh||"", tvv:d.tvv||"", at:Date.now()});
      const pr = p.queue.length;
      if(p.status==="mo_ban"){ p.status="giu_cho"; Queue.setHolderFromQueue(st,p); Queue.startHold(p); }
      Store.pushHistory(p, `Đặt chỗ → Ưu tiên ${pr} (phiếu ${code})`);
      Store.notify(`Sản phẩm ${ma} — ${d.kh} đăng ký (Ưu tiên ${pr}) bởi ${d.dvbh||'ĐVBH'}`, 'Yêu cầu', 'Sản phẩm');
      return ok(`Đã vào hàng đợi — Ưu tiên ${pr} (${code})`, {code, priority:pr});
    });
  }

  /* 2b) ĐVBH xác nhận giữ chỗ: YCDCH cho_xn → giu_cho */
  function confirmHold(ycdchMa){
    {const _d=deny('booking');if(_d)return _d;}
    return Store.mutate(st=>{
      const y = st.ycdch.find(x=>x.ma===ycdchMa); if(!y) return err("Không tìm thấy YCDCH");
      y.status="giu_cho";
      Store.notify(`YCDCH ${ycdchMa} — giữ chỗ thành công`);
      return ok("Giữ chỗ thành công "+ycdchMa);
    });
  }

  /* 3) Chọn KH (Ưu tiên 1) → Đăng ký giao dịch: giu_cho → dang_ky, tạo
        YCDCO; nếu chưa có hàng đợi thì tạo claim trực tiếp. Đếm giờ tiếp. */
  function register(ma, d){
    {const _d=deny('booking');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      d = d||{};
      p.queue = p.queue || [];
      let claim = p.queue[0];
      if(!claim){
        const khName = d.kh || p.khName; if(!khName) return err("Chưa có khách trong hàng đợi");
        const c = ensureCustomer(st, khName, {phone:d.sdt, cccd:d.cccd});
        const yc = Store.nextCode("ycdch","Test-YCDCH-",5);
        st.ycdch.unshift({ma:yc, productMa:ma, customerId:c.id, kh:khName, sdt:d.sdt||c.phone||"", cccd:d.cccd||"",
          tvv:d.tvv||"", san:d.dvbh||"", dvbh:d.dvbh||"", tg:now(), status:"giu_cho"});
        claim={id:'q'+Date.now().toString(36), ycdchMa:yc, customerId:c.id, kh:khName, sdt:d.sdt||"", dvbh:d.dvbh||"", tvv:d.tvv||""};
        p.queue=[claim];
      }
      Queue.setHolderFromQueue(st, p);
      p.status="dang_ky";
      // phiếu giữ chỗ (YCDCH) của ưu tiên 1 đã được ráp vào giao dịch
      const _ych=st.ycdch.find(x=>x.ma===claim.ycdchMa); if(_ych) _ych.status='da_rap';
      const code = Store.nextCode("ycdco","Test-YCDC-",5);
      st.ycdco.unshift({ma:code, hd:"", productMa:ma, kh:claim.kh, sdt:claim.sdt||"",
        tvv:claim.tvv||p.tvv||"", san:claim.dvbh||"", dvbh:claim.dvbh||"", tg:now(), status:"cho_kt"});
      claim.ycdcoMa = code;
      Queue.startHold(p);
      Store.pushHistory(p, `Chọn KH (Ưu tiên 1: ${claim.kh}) → Đăng ký GD (phiếu ${code})`);
      Store.notify(`YCDCO ${code} — đăng ký giao dịch căn ${ma}`, 'Giao dịch', 'Sản phẩm');
      return ok("Đã đăng ký giao dịch "+code, {code});
    });
  }

  /* 4) Sales Admin "đủ hồ sơ": dang_ky → kiem_tra */
  function checkDossier(ma){
    {const _d=deny('contract.manage');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      p.status="kiem_tra";
      Store.pushHistory(p, "Đủ hồ sơ → Đang kiểm tra hồ sơ");
      return ok("Đã chuyển kiểm tra hồ sơ "+ma);
    });
  }

  /* 5) TPKD kiểm duyệt: kiem_tra → cho_duyet */
  function kdReview(ma){
    {const _d=deny('contract.manage');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      p.status="cho_duyet";
      Store.pushHistory(p, "KD kiểm duyệt giao dịch");
      Store.notify(`Căn ${ma} chờ Kế toán xác nhận tiền`, 'Yêu cầu', 'Sản phẩm');
      return ok("KD đã kiểm duyệt "+ma);
    });
  }

  /* 6) Kế toán xác nhận cọc: cho_duyet → da_coc; YCDCO da_coc;
        tạo HĐ cọc (Khởi tạo) + đề nghị thu tiền (PT) */
  function confirmCoc(ma){
    {const _d=deny('accounting.approve');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      p.status="da_coc";
      // thắng thầu: giải phóng các ưu tiên còn lại, dừng đếm giờ
      (p.queue||[]).slice(1).forEach(c=>Queue.releaseClaim(st,c,'da_hoan'));
      p.queue = (p.queue && p.queue[0]) ? [p.queue[0]] : [];
      Queue.clearHold(p);
      // YCDCO -> da_coc
      const y = st.ycdco.find(x=>x.productMa===ma && x.status!=="da_coc");
      const hdc = Store.nextCode("hdcoc","HĐC-Test-",5);
      if(y){ y.status="da_coc"; y.hd=hdc; }
      // tạo HĐ cọc
      st.hdCoc.unshift({so:hdc, ten:`${hdc.toUpperCase()}-${p.khName||""}`.trim(), duAn:"Dự án đào tạo Đợt 1",
        ctbh:"Mở bán", sp:ma, phieuCoc:(y&&y.ma)||"", ngayTao:now().split(" ")[0]||"", status:"cho_kt"});
      // tạo đề nghị thu tiền (cọc 100tr)
      const pt = Store.nextCode("ptthu","PT-",9);
      st.payReqs.unshift({duAn:"Dự án đào tạo Đợt 1", ma:pt, loaiPhieu:"Yêu cầu đặt cọc", kh:p.khName||"",
        san:p.dvbh||"", status:"cho_duyet", ngayTao:now(), chungTu:"", ycdch:"", ycHd:(y&&y.ma)||hdc, sp:ma, soTien:"100.000.000"});
      Store.pushHistory(p, `Kế toán xác nhận cọc → HĐ ${hdc}, phiếu thu ${pt}`);
      Store.notify(`Chuyển cọc thành công căn ${ma} (HĐ ${hdc})`, 'Hợp đồng', 'Hợp đồng');
      return ok("Chuyển cọc thành công — "+hdc, {hdc, pt});
    });
  }

  /* 7) Kế toán duyệt phiếu thu: PT cho_duyet → da_duyet; HĐ cọc cho_kt */
  function approvePayment(ptMa){
    {const _d=deny('accounting.approve');if(_d)return _d;}
    return Store.mutate(st=>{
      const r = st.payReqs.find(x=>x.ma===ptMa); if(!r) return err("Không tìm thấy phiếu thu");
      r.status="da_duyet";
      // tiền cọc về → HĐ cọc liên quan chuyển sang Đã duyệt
      if(r.loaiPhieu==='Yêu cầu đặt cọc'){ const _hd=st.hdCoc.find(h=>h.sp===r.sp && h.status==='cho_kt'); if(_hd) _hd.status='da_duyet'; }
      Store.notify(`Duyệt phiếu thu ${ptMa}`, 'Giao dịch', 'Phiếu thu');
      Store.audit(`Duyệt phiếu thu ${ptMa}`, ptMa);
      return ok("Đã duyệt phiếu thu "+ptMa);
    });
  }

  /* 8) Tạo HĐ Mua bán từ căn đã cọc */
  function createHDMB(ma){
    {const _d=deny('contract.manage');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      const coc = st.hdCoc.find(x=>x.sp===ma);
      const code = Store.nextCode("hdmb","HDMB-Test-",5);
      st.hdMB.unshift({so:code, ten:`${code.toUpperCase()}-${p.khName||""}`.trim(), sp:ma,
        hdCoc:(coc&&coc.so)||"", tenCoc:(coc&&coc.ten)||"", ngayTao:now().split(" ")[0]||"", status:"cho_kt"});
      p.status="hop_dong";
      Store.pushHistory(p, `Tạo HĐ Mua bán ${code}`);
      Store.notify(`Tạo HĐMB ${code} căn ${ma}`, 'Hợp đồng', 'Hợp đồng');
      return ok("Đã tạo HĐ Mua bán "+code, {code});
    });
  }

  /* 9) Thu hồi: giải phóng toàn bộ hàng đợi → mo_ban */
  function reclaim(ma){
    {const _d=deny('booking');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      (p.queue||[]).forEach(c=>Queue.releaseClaim(st,c,'da_hoan'));
      p.queue=[]; Queue.clearHold(p);
      p.status="mo_ban"; p.customerId=null; p.khName=""; p.tvv=""; p.dvbh="";
      Store.pushHistory(p, "Thu hồi → trả về kho, mở bán lại");
      return ok("Đã thu hồi căn "+ma);
    });
  }

  /* 10) Thanh lý: da_coc|hop_dong → thanh_ly */
  function liquidate(ma){
    {const _d=deny('liquidation');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      p.status="thanh_ly";
      Store.pushHistory(p, "Thanh lý hợp đồng");
      Store.notify(`Thanh lý căn ${ma}`);
      return ok("Đã thanh lý căn "+ma);
    });
  }

  /* ============================================================
     LUỒNG HỦY CHỖ & HOÀN TIỀN (3 cấp: Đại lý tạo → KD duyệt → KT hoàn)
     ============================================================ */
  /* 11) Đại lý tạo đề nghị hủy & hoàn tiền cho căn đã phát sinh giao dịch */
  function createRefund(ma, d){
    {const _d=deny('refund.create');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      if(["giu_cho","dat_cho","dang_ky","kiem_tra","cho_duyet","da_coc","hop_dong"].indexOf(p.status)<0) return err("Căn chưa phát sinh giao dịch để hoàn tiền");
      if((st.refunds||[]).some(r=>r.productMa===ma && (r.status==='cho_kd'||r.status==='cho_kt'))) return err("Căn đang có đề nghị hoàn tiền chờ xử lý");
      d=d||{}; const code=Store.nextCode("refund","HT-",6);
      const hdc=(st.hdCoc.find(h=>h.sp===ma)||{}).so||'';
      st.refunds = st.refunds || [];
      st.refunds.unshift({id:code, productMa:ma, kh:p.khName||'', soTien:d.soTien||'100.000.000',
        lyDo:d.lyDo||'Khách yêu cầu hủy', dvbh:p.dvbh||'', ngayTao:now(), status:'cho_kd', hdc});
      Store.pushHistory(p, `Yêu cầu hủy & hoàn tiền (${code})`);
      Store.notify(`Đề nghị hoàn tiền ${code} căn ${ma} — chờ KD duyệt`, 'Yêu cầu', 'Hoàn tiền');
      return ok("Đã tạo đề nghị hoàn tiền "+code, {code});
    });
  }
  /* 12) KD (TPKD) duyệt đề nghị hoàn tiền: cho_kd → cho_kt */
  function approveRefundKD(id){
    {const _d=deny('refund.approve.kd');if(_d)return _d;}
    return Store.mutate(st=>{
      const r=(st.refunds||[]).find(x=>x.id===id); if(!r) return err("Không tìm thấy đề nghị");
      if(r.status!=='cho_kd') return err("Đề nghị không ở trạng thái chờ KD");
      r.status='cho_kt';
      Store.audit(`KD duyệt hoàn tiền ${id}`, id);
      Store.notify(`Hoàn tiền ${id} — KD đã duyệt, chờ Kế toán chuyển tiền`, 'Giao dịch', 'Hoàn tiền');
      return ok("KD đã duyệt hoàn tiền "+id);
    });
  }
  /* 13) Kế toán chuyển tiền + xác nhận hoàn: cho_kt → da_hoan; thu hồi căn, thanh lý HĐ cọc */
  function approveRefundKT(id){
    {const _d=deny('refund.approve.kt');if(_d)return _d;}
    return Store.mutate(st=>{
      const r=(st.refunds||[]).find(x=>x.id===id); if(!r) return err("Không tìm thấy đề nghị");
      if(r.status!=='cho_kt') return err("Đề nghị chưa được KD duyệt");
      r.status='da_hoan';
      const p=st.products.find(x=>x.ma===r.productMa);
      if(p){ (p.queue||[]).forEach(c=>Queue.releaseClaim(st,c,'da_hoan')); p.queue=[]; Queue.clearHold(p);
        p.status='mo_ban'; p.customerId=null; p.khName=''; p.tvv=''; p.dvbh='';
        Store.pushHistory(p, `Hoàn tiền ${id} → thu hồi căn, mở bán lại`); }
      const hd=st.hdCoc.find(h=>h.so===r.hdc); if(hd) hd.status='thanh_ly';
      Store.audit(`Xác nhận hoàn tiền ${id} (đã chuyển tiền)`, id);
      Store.notify(`Đã hoàn tiền ${id} căn ${r.productMa}`, 'Giao dịch', 'Hoàn tiền');
      return ok("Đã hoàn tiền "+id);
    });
  }
  function rejectRefund(id){
    {const _d=deny('refund.approve.kd');if(_d)return _d;}
    return Store.mutate(st=>{ const r=(st.refunds||[]).find(x=>x.id===id); if(!r) return err("Không tìm thấy đề nghị");
      r.status='tu_choi'; Store.audit(`Từ chối hoàn tiền ${id}`, id); return ok("Đã từ chối "+id); });
  }

  /* ============================================================
     LUỒNG CHUYỂN NHƯỢNG (đổi tên HĐ → sinh HĐCN + biên bản thanh lý)
     ============================================================ */
  /* 14) Chuyển nhượng căn đã cọc/đã HĐ cho khách mới */
  function transfer(ma, nc){
    {const _d=deny('contract.transfer');if(_d)return _d;}
    return Store.mutate(st=>{
      const p = st.products.find(x=>x.ma===ma); if(!p) return err("Không tìm thấy SP");
      if(["da_coc","hop_dong"].indexOf(p.status)<0) return err("Chỉ chuyển nhượng căn đã cọc / đã có hợp đồng");
      nc=nc||{}; if(!nc.kh) return err("Thiếu thông tin khách hàng nhận chuyển nhượng");
      const oldKh=p.khName||'';
      const bbtl=Store.nextCode("bbtl","BBTL-",5);
      const code=Store.nextCode("hdcn","HĐCN-Test-",5);
      const c=ensureCustomer(st, nc.kh, {phone:nc.sdt, email:nc.email, cccd:nc.cccd});
      p.customerId=c.id; p.khName=nc.kh;
      st.hdCN.unshift({so:code, loai:(p.status==='hop_dong'?'HĐ thuê':'HĐ Cọc'), bbtl,
        ten:`${code.toUpperCase()}-${nc.kh}`, sp:ma, kh:nc.kh, ngayTao:now().split(' ')[0]});
      Store.pushHistory(p, `Chuyển nhượng: ${oldKh||'—'} → ${nc.kh} (HĐCN ${code} · BBTL ${bbtl})`);
      Store.notify(`Chuyển nhượng căn ${ma}: ${oldKh||'—'} → ${nc.kh}`, 'Hợp đồng', 'Chuyển nhượng');
      return ok("Đã tạo HĐ chuyển nhượng "+code, {code, bbtl});
    });
  }

  /* dispatcher dùng cho nút động trong popup sản phẩm */
  function run(key, ma, data){
    switch(key){
      case "publish":     return publish(ma);
      case "book":        return book(ma, data);
      case "register":    return register(ma, data);
      case "check":       return checkDossier(ma);
      case "kdreview":    return kdReview(ma);
      case "confirmcoc":  return confirmCoc(ma);
      case "createmb":    return createHDMB(ma);
      case "reclaim":     return reclaim(ma);
      case "liquidate":   return liquidate(ma);
      case "refund":      return createRefund(ma, data);
      case "transfer":    return transfer(ma, data);
      default:            return err("Hành động chưa hỗ trợ");
    }
  }

  function ok(msg, extra){ return Object.assign({ok:true, msg}, extra||{}); }
  function err(msg){ return {ok:false, msg}; }

  return { nextActions, run, publish, book, confirmHold, register, checkDossier,
    kdReview, confirmCoc, approvePayment, createHDMB, reclaim, liquidate,
    createRefund, approveRefundKD, approveRefundKT, rejectRefund, transfer };
})();
