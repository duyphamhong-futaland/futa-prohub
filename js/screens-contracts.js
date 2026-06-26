/* ============================================================
   FUTA Land — Prohub  ·  screens-contracts.js
   Hợp đồng cọc / mua bán / chuyển nhượng + thống kê nợ lãi + báo cáo.
   Tiến độ thanh toán & lãi phạt tính bằng Pricing engine.
   ============================================================ */
window.SCREENS = window.SCREENS || {};

let curHD = {type:'coc', so:null};
function openHD(type, so){ curHD={type, so}; go(type==='coc'?'hd-coc-detail':type==='mb'?'hd-mb-detail':'hd-cn-detail'); }
function hdLabel(k){ return CFG.HD_ST[k]||k; }
function hdPill(k){
  const map={khoi_tao:'#E2F6E6;color:#1f9d3d',cho_kt:'#FFF3D6;color:#a9820a',da_duyet:'#E6F0FF;color:#1565d8',thanh_ly:'#ececec;color:#555'};
  return `<span style="background:${map[k]||'#eef0f3;color:#555'};padding:3px 9px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap">${hdLabel(k)}</span>`;
}
function hdApprove(type,so){ if(!Perm.guard('accounting.approve'))return;
  Store.mutate(st=>{ const arr=type==='coc'?st.hdCoc:st.hdMB; const c=arr.find(x=>x.so===so); if(c) c.status='da_duyet'; Store.notify('Duyệt HĐ '+so,'Hợp đồng','Hợp đồng'); Store.audit('Duyệt thu hợp đồng '+so, so); });
  toast('Đã duyệt hợp đồng '+so); App.rerender();
}

/* ---- helpers hiển thị ---- */
function contractToolbar(title,btns,key,statusOpts){
  const sb = key ? Filt.searchBox(key,230) : `<div class="search" style="min-width:230px">🔍<input placeholder="Tìm kiếm"></div>`;
  const st = (key && statusOpts) ? Filt.sel(key,'tt',statusOpts) : '';
  return `<div class="toolbar" style="margin-bottom:16px">
    <div class="page-title" style="margin:0">${title}</div><div class="spacer"></div>
    ${sb}${st}${btns||''}</div>`;
}
function datePH(){return `<div style="position:relative"><input class="inp dis" placeholder="DD/MM/YYYY" disabled style="padding-right:30px"><span style="position:absolute;right:9px;top:50%;transform:translateY(-50%);color:#9aa3af;pointer-events:none">📅</span></div>`;}
function pctInp(v){return `<div style="display:flex"><input class="inp dis" value="${v}" disabled style="border-radius:6px 0 0 6px"><span style="border:1px solid #d6dce6;border-left:none;border-radius:0 6px 6px 0;padding:8px 13px;background:#eef0f3;color:#6b7785">%</span></div>`;}
function pcRow(l,v){return `<div style="display:grid;grid-template-columns:150px 1fr;align-items:center;gap:10px;margin-bottom:11px"><label style="font-size:12px;color:#3a4658">${l}</label>${v}</div>`;}
function pcPair(l1,v1,l2,v2){return `<div style="display:grid;grid-template-columns:118px 1fr 118px 1fr;align-items:center;gap:10px;margin-bottom:11px">
  <label style="font-size:12px;color:#3a4658">${l1}</label>${v1}<label style="font-size:12px;color:#3a4658">${l2}</label>${v2}</div>`;}
function projectCard(p){
  return `<div class="card">
    <div class="section-title">Thông tin dự án</div>
    ${pcRow('Tên dự án',disInp(p.duAn))}${pcRow('Mã sản phẩm',disInp(p.maSP))}${pcRow('Giá sản phẩm',disInp(p.gia))}
    ${pcPair('Giá chưa VAT',disInp(p.chuaVAT),'Giá có VAT',disInp(p.coVAT||'0'))}
    ${pcPair('Tổng Giá bán CH (gồm VAT & KPBT)',disInp(p.tongGia),'Giá trị tính phí bảo trì',disInp('0'))}
    ${pcRow('Chính sách thanh toán',selDis(p.cstt))}
    ${pcRow('Chính sách chiết khấu',selDis(p.csck||''))}
    ${pcRow('Đơn vị tiền tệ',disInp('VND'))}${pcRow('Phí bảo trì',pctInp('2'))}
  </div>`;
}
/* dựng tiến độ thanh toán từ Pricing cho 1 hợp đồng */
function buildSchedule(product, paidFirst){
  const tong = product ? (product.giaVAT||product.giaCB) : 0;
  const sched = Pricing.installments(tong, Pricing.DEFAULT_DOT);
  return sched.map((d,i)=>{
    const da = (paidFirst && i===0) ? 100000000 : 0;
    return [d.stt, da>0?'PT-LK'+d.stt:'-', d.stt, d.mo, d.han||'', d.tyLe+'%', fmtVN(d.soTien), da>0?fmtVN(da):'-', fmtVN(d.soTien-da), '', i===3];
  });
}
/* In tiến độ thanh toán của hợp đồng đang xem (curHD) */
function printSchedule(){
  const st=Store.get(); const type=curHD.type||'coc';
  const arr=type==='mb'?st.hdMB:type==='cn'?st.hdCN:st.hdCoc;
  const c=(arr||[]).find(x=>x.so===curHD.so)||(arr||[])[0];
  if(!c){ toast('Không tìm thấy hợp đồng','err'); return; }
  const p=Store.product(c.sp); const tong=p?(p.giaVAT||p.giaCB):0;
  const sched=Pricing.installments(tong, Pricing.DEFAULT_DOT);
  const rows=sched.map(d=>`<tr><td>${d.stt}</td><td>${esc(d.mo)}</td><td>${esc(d.han||'')}</td><td class="right">${d.tyLe}%</td><td class="right">${fmtVN(d.soTien)}</td></tr>`).join('');
  const body=`<h1>Tiến độ thanh toán</h1>
    <div class="center muted">Hợp đồng ${esc(c.so)}${c.ten?(' — '+esc(c.ten)):''} · Mã căn ${esc(c.sp||'')}</div>
    <table><thead><tr><th>Đợt</th><th>Mô tả</th><th>Hạn TT</th><th class="right">Tỉ lệ</th><th class="right">Số tiền (VNĐ)</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th colspan="4" class="right">Tổng giá trị</th><th class="right">${fmtVN(tong)}</th></tr></tfoot></table>`;
  printDoc('Tiến độ thanh toán — '+c.so, body);
}
function contractDetailDynamic(type){
  const st=Store.get();
  let c, backRoute, title, leftBtns;
  if(type==='coc'){ c=st.hdCoc.find(x=>x.so===curHD.so)||st.hdCoc[0]; backRoute='hd-coc-list'; title='CHỈNH SỬA HỢP ĐỒNG CỌC'; leftBtns=['📄 Tạo thanh lý']; }
  else if(type==='mb'){ c=st.hdMB.find(x=>x.so===curHD.so)||st.hdMB[0]; backRoute='hd-mb-list'; title='CHỈNH SỬA HỢP ĐỒNG MUA BÁN/ THUÊ'; leftBtns=['📊 Lãi tạm tính']; }
  else { c=st.hdCN.find(x=>x.so===curHD.so)||st.hdCN[0]; backRoute='hd-cn-list'; title='CHỈNH SỬA HỢP ĐỒNG CHUYỂN NHƯỢNG'; leftBtns=['🔁 …mua bán/cho thuê','📄 Tạo thanh lý']; }
  if(!c) return emptyState('Không có hợp đồng');
  const p = Store.product(c.sp);
  const khName = c.kh || (c.ten? c.ten.split('-').slice(-1)[0] : '');
  const status = c.status || 'da_duyet';
  const pay = buildSchedule(p, status!=='khoi_tao');
  const tong = p?(p.giaVAT||p.giaCB):0;
  const daTT = status!=='khoi_tao'?100000000:0;
  const payHead=`<tr><th>STT</th><th>Mã phiếu</th><th>Đợt TT</th><th>Mô tả</th><th>Hạn TT</th><th>Tỉ lệ</th><th>Số tiền</th><th>Đã TT</th><th>Còn lại</th><th style="text-align:center">Hành động</th></tr>`;
  const payBody=pay.map(r=>`<tr><td>${r[0]}</td><td>${r[1]==='-'?'':`<span class="code">${r[1]}</span>`}</td><td>${r[2]}</td><td style="white-space:nowrap">${r[3]||''}</td>
     <td style="white-space:nowrap">${r[4]||''}</td><td>${r[5]}</td><td style="white-space:nowrap">${r[6]}</td><td style="white-space:nowrap">${r[7]}</td>
     <td style="white-space:nowrap">${r[8]}</td><td style="text-align:center;white-space:nowrap;color:#8a93a0">${r[10]?'<span style="color:#1565d8">✔</span> ':''}✉ 🕓</td></tr>`).join('');
  const lb=(leftBtns||[]).map(b=>{
    const oc = /thanh l[ýy]/i.test(b) ? `C5BTpl.printContract('thanhly','${c.so}')` : `toast('${b}')`;
    return `<a href="#" style="color:var(--blue);font-weight:600;white-space:nowrap" onclick="${oc};return false">${b}</a>`;
  }).join('');
  const proj={duAn:c.duAn||'Dự án đào tạo Đợt 1', maSP:c.sp, gia:fmtVN(tong),
    chuaVAT:fmtVN(p?p.giaCB:0), coVAT:fmtVN(tong), tongGia:fmtVN(tong),
    cstt:'CS PTTT chuẩn', csck:'CSCK 1%'};
  return `
   <div class="save-row" style="align-items:center;gap:18px;flex-wrap:wrap">
     <div class="page-title" style="margin:0;flex:1">${title}</div>${lb}
     ${hdPill(status)}
     ${status==='cho_kt'&&Perm.can('accounting.approve')?`<button class="btn btn-primary btn-sm" onclick="hdApprove('${type}','${c.so}')">✔ KT duyệt thu</button>`:''}
     <a href="#" style="color:var(--red);font-weight:600" onclick="toast('Mở chỉnh sửa hợp đồng');return false">✎ Chỉnh sửa</a>
     <a href="#" style="color:var(--blue);font-weight:600" onclick="C5BTpl.printContract('${type}','${c.so}');return false">🖨 In HĐ</a>
     <a href="#" style="color:var(--blue);font-weight:600" onclick="go('${backRoute}');return false">↩ Quay lại</a>
   </div>
   <div class="grid2 det">
     <div class="card">
       <div class="section-title">Thông tin chung</div>
       ${frow('Số hợp đồng',0,disInp(c.so))}
       ${frow('Tên hợp đồng',0,disInp(c.ten))}
       ${frow(type==='mb'?'Phiếu hợp đồng cọc':'Phiếu YCDCO',1,disInp(c.phieuCoc||c.hdCoc||c.bbtl||''))}
       ${frow('Tên khách hàng',0,disInp(khName))}
       ${frow('Ngày tạo',0,dateDisI(c.ngayTao||''))}
       ${frow('Hình thức thanh toán',0,selDis(''))}
       ${frow('Tính lãi phạt',0,`<input type="checkbox" checked disabled style="width:18px;height:18px">`)}
     </div>
     ${projectCard(proj)}
   </div>
   <div class="card" style="margin-top:18px">
     <div class="section-title">Tài liệu đính kèm</div>
     ${bigUpload('Upload tài liệu hợp đồng','Tải tối đa 5 files, mỗi file ≤ 10MB · Tổng ≤ 25MB','contract:'+c.so)}
   </div>
   <div class="card" style="margin-top:18px;padding-top:6px">
     <div style="display:flex;align-items:center;border-bottom:1px solid var(--line);margin:0 -2px 14px;flex-wrap:wrap">
       <div style="padding:12px 4px;margin-right:30px;border-bottom:2px solid var(--blue);color:var(--blue);font-weight:700">Lịch sử thanh toán</div>
       <div style="padding:12px 4px;margin-right:30px;color:#5b6573;cursor:pointer" onclick="toast('Danh sách phiếu tính lãi')">Danh sách phiếu tính lãi</div>
       <div style="flex:1"></div>
       <a href="#" style="color:var(--blue);font-weight:600;white-space:nowrap" onclick="printSchedule();return false">🖨 In Tiến độ thanh toán</a>
     </div>
     <div style="overflow:auto"><table class="tbl"><thead>${payHead}</thead><tbody>${payBody}</tbody></table></div>
     <div style="background:#eaf2ff;border:1px solid #d8e6fb;border-radius:0 0 8px 8px;padding:14px 20px;margin-top:-1px">
       ${[['Tổng số tiền cần thanh toán',fmtVN(tong)],['Tổng số tiền đã thanh toán',fmtVN(daTT)],['Tổng số tiền còn lại',fmtVN(tong-daTT)]]
         .map(t=>`<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13.5px"><span style="font-weight:700;color:#2a3340">${t[0]}</span><span style="font-weight:700;color:var(--blue)">${t[1]}</span></div>`).join('')}
     </div>
   </div>`;
}

/* ---- danh sách + chi tiết ---- */
const HD_STATUS_OPTS=['Tất cả','Khởi tạo','Chờ KT thu tiền','Đã duyệt','Đã thanh lý'];
function hdCocResults(){
  const f=Filt.st('hdcoc'); const list=Store.get().hdCoc.filter(r=>{
    if(!Filt.any(f.q, r.so, r.ten, r.sp, r.duAn, r.phieuCoc)) return false;
    if(f.tt && f.tt!=='Tất cả' && hdLabel(r.status)!==f.tt) return false; return true; });
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th style="width:34px"><input type="checkbox"></th><th>STT</th><th>Số hợp đồng</th><th>Tên hợp đồng</th><th>Dự án</th><th>Chương trình</th><th>Mã sản phẩm</th><th>Mã phiếu cọc</th><th>Ngày tạo</th><th>Trạng thái HĐ</th><th style="text-align:center">Hành động</th></tr></thead>
    <tbody>${list.map((r,i)=>`<tr>
      <td><input type="checkbox"></td><td>${i+1}</td>
      <td class="code" style="white-space:nowrap" onclick="openHD('coc','${r.so}')">${r.so}</td>
      <td class="code" style="max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" onclick="openHD('coc','${r.so}')">${r.ten}</td>
      <td style="white-space:nowrap">${r.duAn}</td><td>${r.ctbh}</td><td>${r.sp}</td><td>${r.phieuCoc}</td>
      <td style="white-space:nowrap">${r.ngayTao}</td><td>${hdPill(r.status)}</td>
      <td style="text-align:center">${r.status==='cho_kt'&&Perm.can('accounting.approve')?`<button class="btn btn-sm" style="background:#fff;color:#1f9d3d;border:1px solid #1f9d3d;white-space:nowrap" onclick="event.stopPropagation();hdApprove('coc','${r.so}')">Duyệt thu</button>`:`<button class="btn btn-sm" style="background:#fff;color:#1f9d3d;border:1px solid #1f9d3d;white-space:nowrap" onclick="event.stopPropagation();toast('Cập nhật thanh toán ${r.so}')">Cập nhật TT</button>`}</td></tr>`).join('')||`<tr><td colspan="11" style="text-align:center;color:#9aa3af;padding:30px">Không có hợp đồng phù hợp</td></tr>`}</tbody></table></div>
  ${pagerN('Hiển thị '+list.length+' bản ghi',1)}`;
}
SCREENS["hd-coc-list"]=()=>{ Filt.reg('hdcoc',hdCocResults); return `
  ${contractToolbar('HỢP ĐỒNG CỌC',`
    ${Perm.can('contract.manage')?`<button class="btn btn-primary" onclick="toast('Tạo mới hợp đồng cọc')">Tạo mới hợp đồng cọc</button>`:''}
    <button class="btn btn-primary" onclick="toast('Tải về danh sách HĐ cọc')">Tải về ▾</button>`,'hdcoc',HD_STATUS_OPTS)}
  <div id="hdcoc-res">${hdCocResults()}</div>`; };
SCREENS["hd-coc-detail"]=()=>contractDetailDynamic('coc');

function hdMbResults(){
  const f=Filt.st('hdmb'); const list=Store.get().hdMB.filter(r=>{
    if(!Filt.any(f.q, r.so, r.ten, r.sp, r.hdCoc, r.tenCoc)) return false;
    if(f.tt && f.tt!=='Tất cả' && hdLabel(r.status)!==f.tt) return false; return true; });
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th>STT</th><th>Số hợp đồng</th><th>Tên hợp đồng</th><th>Dự án</th><th>Mã sản phẩm</th><th>Mã HĐ Cọc</th><th>Tên HĐ Cọc</th><th>Ngày tạo</th><th>Trạng thái HĐ</th><th>Hành động</th></tr></thead>
    <tbody>${list.map((r,i)=>`<tr>
      <td>${i+1}</td><td class="code" style="white-space:nowrap" onclick="openHD('mb','${r.so}')">${r.so}</td>
      <td onclick="openHD('mb','${r.so}')" style="cursor:pointer;max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.ten}</td>
      <td style="white-space:nowrap">Dự án đào tạo Đợt 1</td><td>${r.sp}</td>
      <td class="code">${r.hdCoc}</td><td>${r.tenCoc}</td><td style="white-space:nowrap">${r.ngayTao}</td>
      <td>${hdPill(r.status)}</td><td></td></tr>`).join('')||`<tr><td colspan="10" style="text-align:center;color:#9aa3af;padding:30px">Không có hợp đồng phù hợp</td></tr>`}</tbody></table></div>
  ${pagerN('Hiển thị '+list.length+' bản ghi',1)}`;
}
SCREENS["hd-mb-list"]=()=>{ Filt.reg('hdmb',hdMbResults); return `
  ${contractToolbar('HỢP ĐỒNG THUÊ/ MUA BÁN',`
    ${Perm.can('contract.manage')?`<button class="btn btn-primary" onclick="toast('Tạo mới HĐ mua bán')">Tạo mới hợp đồng thuê/ mua bán</button>`:''}
    <button class="btn btn-primary" onclick="toast('Tải về danh sách')">Tải về ▾</button>`,'hdmb',HD_STATUS_OPTS)}
  <div id="hdmb-res">${hdMbResults()}</div>`; };
SCREENS["hd-mb-detail"]=()=>contractDetailDynamic('mb');

function hdCnResults(){
  const f=Filt.st('hdcn'); const list=Store.get().hdCN.filter(r=>{
    if(!Filt.any(f.q, r.so, r.ten, r.sp, r.kh, r.bbtl, r.loai)) return false; return true; });
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th>STT</th><th>Mã hợp đồng</th><th>Loại hợp đồng</th><th>Mã BB thanh lý</th><th>Tên hợp đồng</th><th>Dự án</th><th>Mã sản phẩm</th><th>Tên khách hàng</th><th>Ngày tạo</th></tr></thead>
    <tbody>${list.map((r,i)=>`<tr>
      <td>${i+1}</td><td class="code" style="white-space:nowrap" onclick="openHD('cn','${r.so}')">${r.so}</td><td style="white-space:nowrap">${r.loai}</td><td>${r.bbtl}</td>
      <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.ten}</td><td style="white-space:nowrap">Dự án đào tạo Đợt 1</td><td>${r.sp}</td>
      <td style="white-space:nowrap">${r.kh}</td><td style="white-space:nowrap">${r.ngayTao}</td></tr>`).join('')||`<tr><td colspan="9" style="text-align:center;color:#9aa3af;padding:30px">Không có hợp đồng phù hợp</td></tr>`}</tbody></table></div>
  ${pagerN('Hiển thị '+list.length+' bản ghi',1)}`;
}
SCREENS["hd-cn-list"]=()=>{ Filt.reg('hdcn',hdCnResults); return `
  ${contractToolbar('HỢP ĐỒNG CHUYỂN NHƯỢNG','','hdcn')}
  <div id="hdcn-res">${hdCnResults()}</div>`; };
SCREENS["hd-cn-detail"]=()=>contractDetailDynamic('cn');

/* ---- thống kê nợ lãi (tính bằng Pricing.lateInterest) ---- */
function noLaiRows(){
  const out=[];
  Store.get().hdCoc.filter(h=>h.status==='da_duyet'||h.status==='cho_kt').forEach(h=>{
    const p=Store.product(h.sp); const tong=p?(p.giaVAT||p.giaCB):8e9;
    const sched=Pricing.installments(tong, Pricing.DEFAULT_DOT.slice(1,5));
    const dayArr=[139,138,93,48];
    sched.forEach((d,idx)=>{
      if(out.length>=15) return;
      const days=dayArr[idx]||30;
      const lai=Pricing.lateInterest(d.soTien,0.0003,days);
      out.push([h.sp, (h.ten||'').split('-').slice(-1)[0]||'KH', h.so, 'CS PTTT chuẩn', d.stt, fmtVN(d.soTien),
        '06/02/2026','07/02/2026', fmtVN(d.soTien),'0.03%',days, fmtVN(lai),'', fmtVN(lai),'Chưa thanh toán', p?p.dvbh||'Đại lý A':'Đại lý A']);
    });
  });
  return out;
}
function noLaiResults(){
  const f=Filt.st('nolai'); const rows=noLaiRows().filter(r=>{
    if(!Filt.any(f.q, r[0], r[1], r[2], r[15])) return false;
    if(f.ctbh && f.ctbh!=='Tất cả'){ const blk=f.ctbh.indexOf('CT3')>=0?'CT3':f.ctbh.indexOf('CT7')>=0?'CT7':null; if(blk && String(r[0]).indexOf(blk)!==0) return false; }
    if(!Filt.inRange(r[7], f.from, f.to)) return false;
    return true; });
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th>STT</th><th>Mã Căn</th><th>Tên Khách</th><th>Số HĐ</th><th>PTTT</th><th>Đợt TT</th><th>Số tiền đợt</th><th>Ngày đến hạn</th><th>Ngày bắt đầu tính</th><th>Số tiền cần tính lãi</th><th>Lãi suất</th><th>Số ngày</th><th>Số Tiền Lãi Phạt</th><th>Lãi còn lại</th><th>Trạng thái</th><th>ĐVBH</th></tr></thead>
    <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td>${r.map(x=>`<td style="white-space:nowrap">${x}</td>`).join('').replace(/<td[^>]*><\/td>/,'')}</tr>`).join('')||`<tr><td colspan="16" style="text-align:center;color:#9aa3af;padding:30px">Không có dòng nợ lãi phù hợp</td></tr>`}</tbody></table></div>
  ${pagerN('Hiển thị '+rows.length+' bản ghi',1)}`;
}
SCREENS["hd-no-lai"]=()=>{ Filt.reg('nolai',noLaiResults); return `
  <div class="page-title">THỐNG KÊ NỢ LÃI</div>
  <div style="display:flex;gap:22px;align-items:flex-end;flex-wrap:wrap;margin:6px 0 18px">
    ${fField('Từ khóa tìm kiếm', Filt.search('nolai','Nhập từ khoá',170))}
    ${fField('Chương trình bán hàng', Filt.sel('nolai','ctbh',['Tất cả','Mở bán CT7','Mở bán CT3']))}
    ${fField('Từ ngày', Filt.date('nolai','from'))}${fField('Đến ngày', Filt.date('nolai','to'))}
    <div style="display:flex;gap:10px;align-items:center"><button class="btn" style="background:var(--orange);color:#fff" onclick="Filt.paint('nolai')">Tìm kiếm</button><span style="color:var(--orange);font-size:18px;cursor:pointer" onclick="Filt.reset('nolai')">⟳</span></div>
    <div style="flex:1"></div>
    <button class="btn btn-ghost" style="border:1px solid #1f9d3d;color:#1f9d3d" onclick="toast('Đang xuất Excel...')">🟢 Xuất excel</button>
  </div>
  <div id="nolai-res">${noLaiResults()}</div>`; };

/* ---- báo cáo hợp đồng dự án (từ sản phẩm có khách) ---- */
function baocaoRows(){
  const projs=Store.get().projects||[];
  return Store.products().filter(p=>p.khName).map(p=>{
    // mức mua sỉ theo chính sách thật của dự án (POL); fallback 1%/2% nếu chưa gắn
    let r1=0.01, r2=0.02;
    if(typeof POL!=='undefined'){
      const proj=projs.find(x=>x.id===p.duAnId); const pol=POL.byName(proj&&proj.ten);
      if(pol){ const ms=(POL.rates(pol.key).muaSi||[]).slice().sort((a,b)=>a.min-b.min); if(ms[0])r1=ms[0].pct; if(ms[1])r2=ms[1].pct; }
    }
    const ck1=Math.round((p.giaCB||0)*r1), ck2=Math.round((p.giaCB||0)*r2);
    const cust=p.customerId?Store.customer(p.customerId):null;
    return [p.khName, (cust&&cust.phone)||'', (cust&&cust.email)||'', p.ma, pLabel(p.status), fmtVN(p.giaCB), (+(r1*100).toFixed(2))+'%', fmtVN(ck1), (+(r2*100).toFixed(2))+'%', fmtVN(ck2)];
  });
}
function baocaoResults(){
  const f=Filt.st('baocao'); const rows=baocaoRows().filter(r=>{
    if(!Filt.any(f.q, r[3], r[0], r[2], r[1])) return false;
    if(f.tt && f.tt!=='Tất cả' && r[4]!==f.tt) return false; return true; });
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th>STT</th><th>Khách hàng</th><th>Số điện thoại</th><th>Email</th><th>Mã căn</th><th>Trạng thái</th><th>Giá trị trước VAT</th><th>CSCK 1%</th><th>Số tiền</th><th>CSCK 2%</th><th>Số tiền</th></tr></thead>
    <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td>${r.map(x=>`<td style="white-space:nowrap">${x}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="11" style="text-align:center;color:#9aa3af;padding:40px">Chưa có dữ liệu</td></tr>`}</tbody></table></div>
  ${pagerN('Hiển thị '+rows.length+' bản ghi',1)}`;
}
SCREENS["hd-baocao"]=()=>{ Filt.reg('baocao',baocaoResults);
  const sts=['Tất cả'].concat([...new Set(baocaoRows().map(r=>r[4]))]);
  return `<div class="page-title">BÁO CÁO HỢP ĐỒNG DỰ ÁN</div>
  <div style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;margin-bottom:18px">
    ${fField('Tìm theo mã căn / khách', Filt.search('baocao','Nhập từ khoá',150))}
    ${fField('Trạng thái', Filt.sel('baocao','tt',sts))}
    <div style="display:flex;gap:10px;align-items:center"><button class="btn" style="background:var(--orange);color:#fff" onclick="Filt.paint('baocao')">Tìm kiếm</button><span style="color:var(--orange);font-size:18px;cursor:pointer" onclick="Filt.reset('baocao')">⟳</span></div>
    <div style="flex:1"></div><button class="btn" style="background:var(--orange);color:#fff" onclick="toast('Đang tải xuống...')">Tải xuống</button></div>
  <div id="baocao-res">${baocaoResults()}</div>`; };

function hdImportRows(){ return [
    ['HopDong_Coc_T6.xlsx','HĐ Cọc','Võ Hoàng Vân','20/06/2026 09:14','120','120','0','Hoàn tất'],
    ['HopDong_MuaBan_T5.xlsx','HĐ Mua bán','Võ Hoàng Vân','12/05/2026 16:40','85','82','3','Hoàn tất'],
  ]; }
function hdImportResults(){
  const f=Filt.st('hdimport'); const rows=hdImportRows().filter(r=>Filt.any(f.q, r[0], r[1], r[2]));
  return `<table class="tbl"><thead><tr><th>STT</th><th>Tên file</th><th>Loại</th><th>Người tải</th><th>Thời gian</th><th>Số dòng</th><th>Thành công</th><th>Lỗi</th><th>Trạng thái</th></tr></thead>
  <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td class="code">${r[0]}</td><td>${r[1]}</td><td style="white-space:nowrap">${r[2]}</td><td style="white-space:nowrap">${r[3]}</td><td>${r[4]}</td><td style="color:#1f9d3d">${r[5]}</td><td style="color:${r[6]==='0'?'#5b6573':'#d0392b'}">${r[6]}</td><td>${stPill('Đã duyệt').replace('Đã duyệt',r[7])}</td></tr>`).join('')||`<tr><td colspan="9" style="text-align:center;color:#9aa3af;padding:30px">Không có file phù hợp</td></tr>`}</tbody></table>
  ${pagerN('Hiển thị '+rows.length+' bản ghi',1)}`;
}
SCREENS["hd-importlog"]=()=>{ Filt.reg('hdimport',hdImportResults); return `
  <div class="toolbar" style="margin-bottom:16px"><div class="page-title" style="margin:0">LỊCH SỬ TẢI NHẬP</div><div class="spacer"></div>
    ${Filt.searchBox('hdimport',230)}
    <button class="btn btn-primary" onclick="toast('Tải lên file hợp đồng')">⬆ Tải lên</button></div>
  <div id="hdimport-res">${hdImportResults()}</div>`; };
