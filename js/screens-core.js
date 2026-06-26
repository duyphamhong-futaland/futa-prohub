/* ============================================================
   FUTA Land — Prohub  ·  screens-core.js
   Dự án (cards) + Quản lý bán hàng (Bảng hàng · YCDCH · YCDCO ·
   Giao dịch · Quy trình · Dashboard). Đọc từ Store, ghi qua Workflow.
   ============================================================ */
window.SCREENS = window.SCREENS || {};
window.AFTER = window.AFTER || {};

/* ---------- DỰ ÁN: danh sách (cards) ---------- */
function projectsResults(){
  const f=Filt.st('proj');
  const projs=Store.get().projects.filter(p=>{
    if(!Filt.any(f.q, p.ten, p.code, p.loai, p.chuDauTu)) return false;
    if(f.tt && f.tt!=='Trạng thái' && p.trangThai!==f.tt) return false;
    return true;
  });
  return `<div class="proj-grid">
    ${projs.map(p=>`
      <div class="proj-card">
        <div class="pc-body">
          <div class="pc-thumb">${p.code}</div>
          <div class="pc-info"><b>${p.ten}</b><div class="t">${p.loai} · ${p.trangThai||''}</div></div>
        </div>
        <div class="pc-foot">
          <button onclick="openProjectDetail('${p.id}')">⚙ Thiết lập</button>
          <button class="dis">🎫 Esalekit</button>
        </div>
      </div>`).join('')||`<div style="color:#9aa3af;padding:40px">Không có dự án phù hợp</div>`}
  </div>`;
}
SCREENS.projects = ()=>{ Filt.reg('proj',projectsResults); return `
  <div class="toolbar">
    <div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Tìm kiếm nhanh</div>
      ${Filt.searchBox('proj',260)}</div>
    <div class="spacer"></div>
    ${Perm.can("project.config")?`<button class="btn btn-ghost" onclick="go('project-form')">⊕ Tạo mới dự án</button>`:''}
    ${Filt.sel('proj','tt',['Trạng thái','Đang mở bán','Sắp mở bán','Đã đóng'])}
  </div>
  <div id="proj-res">${projectsResults()}</div>`; };
function openProjectDetail(pid){ window.curProject = pid; go('detail'); }

/* ============================================================
   QUẢN LÝ BÁN HÀNG — chi tiết (tabbed)
   ============================================================ */
let dtab = 'banghang';
let bhView = 'sodo';   // 'sodo' (lưới) | 'uutien' (danh sách hàng đợi)
function setDTab(t){ dtab=t; App.renderContent(); window.scrollTo(0,0); }
function setBhView(v){ bhView=v; Filt.paint('detail'); }
SCREENS.detail = ()=>detailHTML();

function detailHTML(){
  const pjId = window.curProject || "P1";
  const pj = Store.get().projects.find(p=>p.id===pjId) || Store.get().projects[0];
  const showSel = (dtab==='banghang'||dtab==='giaodich');
  const tabs=[['banghang','Bảng hàng'],['ycdch','Danh sách YCDCH'],['ycdco','Danh sách YCDCO'],
    ['giaodich','Danh sách giao dịch'],['quytrinh','Hướng dẫn quy trình'],['dashboard','Dashboard']];
  let head=`<div class="pd-head"><div class="pd-name">${pj.ten} ▾</div>`;
  if(showSel){ head+=`<div style="position:relative"><div class="sel" onclick="toggleMenu(event,'ctbhPanel')">Bảng hàng tổng <span class="b">2</span> ▾</div>
      <div id="ctbhPanel" class="menu hidden" style="min-width:240px">
        <label class="chk" style="padding:9px 16px;margin:0"><input type="checkbox"> Tất cả</label>
        <label class="chk" style="padding:9px 16px;margin:0;background:var(--nav-active)"><input type="checkbox" checked> Futa CT007</label>
        <label class="chk" style="padding:9px 16px;margin:0"><input type="checkbox"> Mở bán</label>
        <div style="border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:8px;padding:8px 12px">
          <button class="btn btn-ghost btn-sm" onclick="closeMenus()">↻ Thiết lập lại</button>
          <button class="btn btn-primary btn-sm" onclick="closeMenus();toast('Đã lọc theo CTBH')">▽ Áp dụng</button></div></div></div>`; }
  head+=`<div class="search">🔍<input placeholder="Tìm kiếm" value="${esc(Filt.st('detail').q||'')}" oninput="Filt.inp(this,'detail','q')"></div><button class="btn btn-ghost btn-sm" style="margin-left:auto" title="Xoá lọc" onclick="Filt.reset('detail')">⏏</button></div>`;
  // action bar
  let act=`<div class="actbar">`;
  if(dtab==='banghang' && Perm.can('ctbh.manage')){
    act+=`<button class="btn btn-primary">Quản lý sản phẩm ▾</button>
      <div style="position:relative;display:inline-block"><button class="btn btn-primary" onclick="toggleMenu(event,'giaMenu')">Quản lý giá ▾</button>
        <div id="giaMenu" class="menu hidden" style="min-width:180px"><div onclick="closeMenus();updatePrice()">Cập nhật giá</div><div onclick="closeMenus();openPublish()">Công bố giá</div></div></div>
      <button class="btn btn-primary" onclick="openImport()">Tải nhập</button>`;
  }
  const dlItems=[
    ['Tải về biểu mẫu bảng hàng (.xlsx)',"Importer.template('xlsx')"],
    ['Tải về biểu mẫu bảng hàng (.csv)',"Importer.template('csv')"],
    ['Tải về - Bảng hàng (.xlsx)',"Importer.exportBangHang('xlsx')"],
    ['Tải về - Bảng hàng (.csv)',"Importer.exportBangHang('csv')"],
    ['Tải về thống kê số lượng ưu tiên',"toast('Đang tải...')"],
    ['Tải về khách hàng tiềm năng',"toast('Đang tải...')"],
    ['Tải về biểu mẫu cập nhật giá',"toast('Đang tải...')"],
  ];
  act+=`<div style="position:relative;display:inline-block"><button class="btn btn-primary" onclick="toggleMenu(event,'dlmenu')">Tải về ▾</button>
      <div id="dlmenu" class="menu hidden">${dlItems.map(it=>`<div onclick="closeMenus();${it[1]}">${it[0]}</div>`).join('')}</div></div></div>`;
  const tabsRow=`<div class="tabs">${tabs.map(t=>`<div class="tab ${dtab===t[0]?'active':''}" onclick="setDTab('${t[0]}')">${t[1]}</div>`).join('')}</div>`;
  const bodies={banghang:bhBody,ycdch:ycdchBody,ycdco:ycdcoBody,giaodich:giaodichBody,quytrinh:quytrinhBody,dashboard:dashBody};
  Filt.reg('detail', ()=>bodies[dtab]());
  return head+act+tabsRow+`<div id="detail-res" style="margin-top:14px">${bodies[dtab]()}</div>`;
}

/* ---- Bảng hàng: lưới sinh từ Store, màu theo state-machine ---- */
function bhGrid(block){
  const b = Store.get().ctbh.blocks.find(x=>x.block===block); if(!b) return '';
  const flt=Filt.st('detail'); const q=(flt.q||'').toLowerCase(); const dvbhSel=flt.dvbh||[];
  const stSel=flt.bhStatus && flt.bhStatus!=='Tất cả trạng thái' ? flt.bhStatus : null;
  const filtering=!!(q||dvbhSel.length||stSel);
  let h=`<div class="block-title">BLOCK ${block}</div><div class="colhead">${b.cols.map(c=>`<span>${c}</span>`).join('')}</div>`;
  b.floors.forEach(f=>{
    if(f==='013'||f==='012A'){ h+=`<div class="grid-row"><div class="floor">${f}</div></div>`; return; }
    h+=`<div class="grid-row"><div class="floor">${f}</div>`;
    let rc=0;
    b.cols.forEach(c=>{
      const ma=`${block}-${f}.${c}`;
      const p=Store.product(ma);
      const st=(p?CFG.PSTATUS[p.status]:CFG.PSTATUS.chua_mo_ban)||CFG.PSTATUS.chua_mo_ban;
      if(p && p.status!=='chua_mo_ban') rc++;
      const matched = (!q || ma.toLowerCase().indexOf(q)>=0 || (p&&String(p.khName||'').toLowerCase().indexOf(q)>=0))
        && (!dvbhSel.length || (p && dvbhSel.indexOf(p.dvbh)>=0))
        && (!stSel || (p && st.label===stSel));
      const border = st.grid==='#FFFFFF' ? ';border:1px solid #ddd' : '';
      const dim = (filtering && !matched) ? ';opacity:.18' : '';
      const dollar = (p && p.congKhaiGia && p.status!=='chua_mo_ban') ? `<sup style="font-size:7px">$</sup>` : '';
      h+=`<div class="unit" style="background:${st.grid};${st.dark?'color:#fff':''}${border}${dim}" title="${ma} — ${st.label}${p&&p.khName?' — '+p.khName:''}" onclick="openProduct('${ma}')">${c}${dollar}</div>`;
    });
    h+=`<div class="rowcount">${rc}</div></div>`;
  });
  return h;
}
function bhLegend(){
  const counts=Store.statusCounts(p=>p.ctbhId==='CTBH1');
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const sw = CFG.PSTATUS_ORDER.map(k=>{const d=CFG.PSTATUS[k];const border=d.grid==='#FFFFFF'?'border:1px solid #ddd':'';
    return `<span class="sw" title="${d.label}" style="background:${d.grid};${border};${d.dark?'color:#fff':''}">${counts[k]||0}</span>`;}).join('');
  const flt=Filt.st('detail'); const dvbhSel=flt.dvbh||[];
  const stOpts=['Tất cả trạng thái'].concat(CFG.PSTATUS_ORDER.map(k=>CFG.PSTATUS[k].label));
  const activeNote = (flt.q||dvbhSel.length||(flt.bhStatus&&flt.bhStatus!=='Tất cả trạng thái'))
    ? `<a href="#" style="margin-left:8px;font-size:11px" onclick="Filt.reset('detail');return false">✕ Xoá lọc</a>` : '';
  return `<div class="legend"><span class="lg-all">Σ Tất cả ${total}</span>
    ${sw}${activeNote}
    <div class="viewtoggle">
      <select class="inp" style="min-width:150px;padding:6px 8px" onchange="Filt.inp(this,'detail','bhStatus')">
        ${stOpts.map(o=>`<option ${o===flt.bhStatus?'selected':''}>${o}</option>`).join('')}</select>
      <div style="position:relative"><div class="sel" onclick="toggleMenu(event,'dvbhPanel')" style="min-width:170px">Đơn vị bán hàng${dvbhSel.length?' ('+dvbhSel.length+')':''} ▾</div>
        <div id="dvbhPanel" class="menu hidden" style="min-width:280px">
          ${Store.get().dvbhList.map(d=>`<label class="chk" style="padding:9px 16px;margin:0"><input type="checkbox" class="dvbh-chk" value="${esc(d)}" ${dvbhSel.indexOf(d)>=0?'checked':''}> ${d}</label>`).join('')}
          <div style="border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:8px;padding:8px 12px">
            <button class="btn btn-ghost btn-sm" onclick="resetDvbhFilter()">↻ Thiết lập lại</button>
            <button class="btn btn-primary btn-sm" onclick="applyDvbhFilter()">▽ Lọc</button></div></div></div>
      <span>Xem theo dạng:</span><div class="vt"><button class="${bhView==='sodo'?'on':''}" onclick="setBhView('sodo')">Sơ đồ</button><button class="${bhView==='uutien'?'on':''}" onclick="setBhView('uutien')">Ưu tiên</button></div>
    </div></div>`;
}
function applyDvbhFilter(){
  const sel=[].slice.call(document.querySelectorAll('.dvbh-chk:checked')).map(c=>c.value);
  Filt.set('detail',{dvbh:sel}); closeMenus(); Filt.paint('detail');
  toast(sel.length?('Lọc theo '+sel.length+' ĐVBH'):'Bỏ lọc ĐVBH');
}
function resetDvbhFilter(){ Filt.set('detail',{dvbh:[]}); closeMenus(); Filt.paint('detail'); }
function bhBody(){
  const body = bhView==='uutien' ? bhPriorityList()
    : `<div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
        <div class="bh-wrap">${bhGrid('CT3')}</div>
        <div class="bh-wrap">${bhGrid('CT7')}</div></div>`;
  return `${bhLegend()}${body}`;
}

/* ---- Bảng hàng dạng DANH SÁCH ƯU TIÊN (mỗi căn 1 dòng + 3 cột ưu tiên) ---- */
function bhPriorityList(){
  const flt=Filt.st('detail'); const q=(flt.q||'').toLowerCase(); const dvbhSel=flt.dvbh||[];
  const stSel=flt.bhStatus && flt.bhStatus!=='Tất cả trạng thái' ? flt.bhStatus : null;
  let list=Store.products().filter(p=>p.ctbhId==='CTBH1' && p.status!=='chua_mo_ban' && Perm.inScope(p.dvbh));
  list=list.filter(p=>{
    if(q && !(p.ma.toLowerCase().indexOf(q)>=0 || String(p.khName||'').toLowerCase().indexOf(q)>=0)) return false;
    if(dvbhSel.length && dvbhSel.indexOf(p.dvbh)<0) return false;
    if(stSel && (CFG.PSTATUS[p.status]||{}).label!==stSel) return false;
    return true;
  });
  list.sort((a,b)=> a.ma<b.ma?-1 : a.ma>b.ma?1 : 0);
  let c1=0,c2=0,c3=0; list.forEach(p=>{const Q=p.queue||[]; if(Q[0])c1++; if(Q[1])c2++; if(Q[2])c3++;});
  const cell=(claim,p,i)=> claim
    ? `<div style="font-weight:600">${claim.kh}</div><div style="color:var(--muted);font-size:11px">${claim.dvbh||''}${(i===0&&p.holdUntil&&(p.status==='giu_cho'||p.status==='dang_ky'))?` · còn <b data-countdown="${p.holdUntil}" style="color:var(--red)">${Queue.fmt(Queue.remaining(p))}</b>`:''}</div>`
    : '<span style="color:#c9ccd2">—</span>';
  const badge=(p)=>{const d=CFG.PSTATUS[p.status]||{};const border=d.grid==='#FFFFFF'?'border:1px solid #ddd':'';
    return `<span style="display:inline-block;background:${d.grid};${d.dark?'color:#fff':''};${border};padding:4px 12px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer" title="${d.label}" onclick="openProduct('${p.ma}')">${p.ma}</span>`;};
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th style="width:48px">STT</th><th>Thông Tin Sản Phẩm</th><th>Ưu tiên 1(${c1})</th><th>Ưu tiên 2(${c2})</th><th>Ưu tiên 3(${c3})</th></tr></thead>
    <tbody>${list.map((p,i)=>{const Q=p.queue||[];return `<tr>
      <td><span style="background:var(--blue2);color:#fff;border-radius:5px;padding:3px 8px;font-size:11px;font-weight:700">${i+1}</span></td>
      <td>${badge(p)}<div style="color:var(--muted);font-size:11px;margin-top:4px">${p.block} | ${p.tang}</div></td>
      <td style="min-width:170px">${cell(Q[0],p,0)}</td><td style="min-width:170px">${cell(Q[1],p,1)}</td><td style="min-width:170px">${cell(Q[2],p,2)}</td></tr>`;}).join('')
      ||`<tr><td colspan="5" style="text-align:center;color:#9aa3af;padding:34px">Không có sản phẩm phù hợp</td></tr>`}</tbody></table></div>`;
}

/* ---- popup chi tiết sản phẩm: cơ cấu giá + hành động state-machine ---- */
function openProduct(ma, mode){
  const p=Store.product(ma); if(!p){ toast('Không tìm thấy sản phẩm','err'); return; }
  window._openProductMa = ma;
  const st=CFG.PSTATUS[p.status]||{};
  // Chiết khấu ăn theo chính sách thật (POL) của dự án — file-based, sửa policies.js là đổi
  const _proj=(Store.get().projects||[]).find(x=>x.id===p.duAnId);
  let _pol=(typeof POL!=='undefined')?POL.byName(_proj&&_proj.ten):null, _polDemo=false;
  if(!_pol && typeof POL!=='undefined'){ _pol=POL.byKey('c5b'); _polDemo=true; }  // dự án demo → tham chiếu C5B
  const _ms=_pol?POL.methods(_pol.key):[];
  const _method=(window._ckMethod && _ms.some(m=>m.key===window._ckMethod))?window._ckMethod:(_ms[0]?_ms[0].key:'');
  const _ckInfo=_pol?POL.discount(_pol.key,_method):{pct:0,label:''};
  const _ckAmount=Math.round((p.giaCB||0)*(_ckInfo.pct||0));
  const bd=Pricing.breakdown(p.giaVAT||p.giaCB, p.ttuy, {khac:_ckAmount});
  const base=[['Mã BĐS',ma],['Loại sản phẩm',p.loai],['Trạng thái',pPill(p.status)],
     ['Diện tích thông thủy',(p.ttuy||0)+' m²'],['Diện tích tim tường',(p.tim||0)+' m²'],
     ['Hướng',p.huong],['Hướng cửa chính',p.cua],
     ['Giá trị căn bán (chưa VAT)',fmtMoney(p.giaCB)],['Đơn giá thông thủy (chưa VAT)',fmtMoney(p.donGia)],
     ['Giá bán (có VAT)',fmtMoney(p.giaVAT)]];
  const cust = p.khName ? [['Khách hàng',p.khName],['Tư vấn viên',p.tvv||'—'],['ĐVBH',p.dvbh||'—']] : [];
  // cơ cấu giá
  const crow=(k,v)=>`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px dashed #eef1f5"><span style="color:#5b6573">${k}</span><span style="font-weight:600">${v}</span></div>`;
  const polBlock = _pol ? `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0 4px;font-size:12px">
      <span style="color:#5b6573">Phương thức / chính sách:</span>
      <select onchange="window._ckMethod=this.value;openProduct('${ma}','${mode||''}')" style="padding:5px 8px;border:1px solid #d6dce6;border-radius:6px;font-size:12px">
        ${_ms.map(m=>`<option value="${m.key}"${m.key===_method?' selected':''}>${m.label} (${m.pct?(+(m.pct*100).toFixed(2)+'% CK'):'không CK'})</option>`).join('')}
      </select>
      ${_polDemo?`<span style="color:#b5640f">· demo → tham chiếu ${_pol.name}</span>`:`<span style="color:#1f9d3d">· ${_pol.name}</span>`}
    </div>
    ${_ckAmount?crow('(4) Chiết khấu chính sách ('+(+(_ckInfo.pct*100).toFixed(2))+'%)','− '+fmtMoney(_ckAmount)):''}
    ${crow('(5) Giá phải thanh toán (sau CK)',fmtMoney(bd.giaPhaiTT))}` : '';
  const coCau=`<div class="section-title" style="font-size:13px;margin-top:14px">Cơ cấu giá (đúng công thức Excel)</div>
    ${crow('Giá niêm yết (gồm VAT & KPBT)',fmtMoney(bd.giaNiemYet))}
    ${polBlock}
    ${crow('(6) QSD đất phân bổ (461.505 × DTTT)',fmtMoney(bd.qsd))}
    ${crow('(7) KPBT 2%',fmtMoney(bd.kpbt))}
    ${crow('(8) Giá trị căn hộ',fmtMoney(bd.giaTriCan))}
    ${crow('(9) VAT 10%',fmtMoney(bd.vat))}
    ${crow('(10) Giá bán chưa VAT',fmtMoney(bd.giaChuaVAT))}
    <div style="display:flex;justify-content:space-between;padding:7px 0;font-weight:700;color:var(--blue)"><span>Tổng giá phải thanh toán</span><span>${fmtMoney(bd.tong)}</span></div>`;
  // hành động
  let actionsHTML;
  if(mode==='book'||mode==='register'){
    actionsHTML = bookFormHTML(ma, mode, p);
  } else {
    const acts=Workflow.nextActions(p);
    const showQueue = ['mo_ban','giu_cho','dang_ky'].indexOf(p.status)>=0 || (p.queue&&p.queue.length);
    const qp = showQueue ? queuePanelHTML(p) : '';
    const btns = (acts.length || !qp)
      ? `<div class="modal-actions">${acts.length
            ? acts.map(a=>`<button class="btn ${a.cls}" onclick="onProductAction('${ma}','${a.key}')">${a.label}</button>`).join('')
            : (qp?'':'<span style="color:#9aa3af;font-size:12px">Không có hành động khả dụng cho trạng thái «'+st.label+'» với vai trò hiện tại.</span>')}</div>`
      : '';
    actionsHTML = qp + btns;
  }
  // lịch sử
  const hist = (p.history&&p.history.length)
    ? p.history.map(h=>`<div style="font-size:11.5px;color:#5b6573;padding:4px 0;border-bottom:1px dashed #eef1f5">• ${h.t} <span style="color:#9aa3af">— ${h.by}, ${h.at}</span></div>`).join('')
    : '<div style="color:#9aa3af;font-size:12px;padding:4px 0">Chưa có lịch sử.</div>';
  document.getElementById('modalRoot').innerHTML=`
  <div class="overlay" onclick="if(event.target===this)closeModal()">
   <div class="modal">
    <div class="modal-h"><b>Chi tiết sản phẩm — ${ma}</b><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b" style="max-height:80vh;overflow:auto">
      <div class="section-title" style="font-size:13px">Thông tin sản phẩm</div>
      ${base.concat(cust).map(r=>`<div class="pinfo"><div class="k">${r[0]}</div><div class="v">${r[1]}</div></div>`).join('')}
      ${coCau}
      ${actionsHTML}
      <hr class="soft"><div style="font-weight:700;color:var(--blue2);font-size:12.5px;margin-bottom:6px">Lịch sử</div>${hist}
    </div>
   </div>
  </div>`;
}
function onProductAction(ma,key){
  if(key==='book'||key==='register'){ openProduct(ma,key); return; }
  if(key==='refund'){ openRefundForm(ma); return; }
  if(key==='transfer'){ openTransferForm(ma); return; }
  runWF(key, ma);
}
/* form Hủy & hoàn tiền */
function openRefundForm(ma){
  const p=Store.product(ma)||{};
  document.getElementById('modalRoot').innerHTML=`
  <div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="width:560px">
    <div class="modal-h"><b>Yêu cầu hủy &amp; hoàn tiền — ${ma}</b><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="note-bar">Quy trình 3 cấp: Đại lý tạo → <b>KD duyệt</b> → <b>Kế toán chuyển tiền &amp; xác nhận</b>. Hoàn tất thì căn được thu hồi về kho.</div>
      ${frow('Khách hàng',0,disInp(p.khName||''))}
      ${frow('Số tiền hoàn',1,inpId('rfAmount','100.000.000'))}
      ${frow('Lý do',1,`<textarea id="rfReason" class="inp" placeholder="Lý do hủy/hoàn tiền">Khách yêu cầu hủy</textarea>`)}
      <div class="modal-actions" style="justify-content:flex-end">
        <button class="btn btn-ghost" onclick="openProduct('${ma}')">Quay lại</button>
        <button class="btn btn-primary" onclick="submitRefund('${ma}')">Tạo đề nghị hoàn tiền</button>
      </div>
    </div></div></div>`;
}
function submitRefund(ma){
  const v=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  runWF('refund', ma, {soTien:v('rfAmount'), lyDo:v('rfReason')});
}
/* form Chuyển nhượng */
function openTransferForm(ma){
  const p=Store.product(ma)||{};
  document.getElementById('modalRoot').innerHTML=`
  <div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="width:600px">
    <div class="modal-h"><b>Chuyển nhượng (đổi tên hợp đồng) — ${ma}</b><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="note-bar">Tạo <b>Hợp đồng chuyển nhượng (HĐCN)</b> + <b>Biên bản thanh lý (BBTL)</b>; căn đổi chủ sang khách mới.</div>
      ${frow('Khách chuyển nhượng (cũ)',0,disInp(p.khName||''))}
      ${frow('Họ tên khách nhận',1,inpId('tfName','','Khách hàng nhận chuyển nhượng'))}
      ${frow('Số điện thoại',0,inpId('tfPhone','','09xx xxx xxx'))}
      ${frow('CCCD/Hộ chiếu',0,inpId('tfCccd','','Số CCCD'))}
      ${frow('Email',0,inpId('tfEmail','','email@...'))}
      <div class="modal-actions" style="justify-content:flex-end">
        <button class="btn btn-ghost" onclick="openProduct('${ma}')">Quay lại</button>
        <button class="btn btn-primary" onclick="submitTransfer('${ma}')">Tạo HĐ chuyển nhượng</button>
      </div>
    </div></div></div>`;
}
function submitTransfer(ma){
  const v=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const kh=v('tfName'); if(!kh){ toast('Nhập tên khách nhận chuyển nhượng','warn'); return; }
  runWF('transfer', ma, {kh, sdt:v('tfPhone'), cccd:v('tfCccd'), email:v('tfEmail')});
}
/* ---- panel HÀNG ĐỢI ƯU TIÊN (Ưu Tiên 1/2/3 + đếm ngược + thao tác) ---- */
function queuePanelHTML(p){
  const q=p.queue||[]; const canBook=Perm.can('booking');
  const counting=(p.status==='giu_cho'||p.status==='dang_ky') && p.holdUntil;
  const rows = q.length ? q.map((c,i)=>{
    const cd=(i===0 && counting)?` · còn <b data-countdown="${p.holdUntil}" style="color:var(--red)">${Queue.fmt(Queue.remaining(p))}</b>`:'';
    const tag=(i===0 && p.status==='dang_ky')?' <span style="color:var(--orange);font-weight:600">(đang đăng ký)</span>':'';
    return `<div class="prio"><span>Ưu Tiên <span class="n">${i+1}</span></span>
      <div style="font-size:12.5px">${c.kh} <span style="color:var(--muted)">(${c.dvbh||'—'})</span>${cd}${tag}</div></div>`;
  }).join('') : '<div style="color:#9aa3af;font-size:12px;padding:4px 0">Chưa có ai trong hàng đợi — căn đang mở bán.</div>';
  const acts=[];
  if(canBook && q.length<CFG.QUEUE.maxPriority && ['mo_ban','giu_cho','dang_ky'].indexOf(p.status)>=0)
    acts.push(`<button class="btn btn-ghost btn-sm" onclick="openProduct('${p.ma}','book')">＋ Đặt chỗ (vào hàng đợi)</button>`);
  if(canBook && q.length && p.status==='giu_cho')
    acts.push(`<button class="btn btn-primary btn-sm" onclick="runWF('register','${p.ma}')">Chọn KH → Đăng ký GD</button>`);
  if(canBook && q.length && (p.status==='giu_cho'||p.status==='dang_ky'))
    acts.push(`<button class="btn btn-ghost btn-sm" onclick="runWF('reclaim','${p.ma}')">🧺 Thu hồi</button>`);
  return `<hr class="soft"><div style="font-weight:700;color:var(--blue2);font-size:13px;margin-bottom:8px">Hàng đợi ưu tiên (tối đa ${CFG.QUEUE.maxPriority})</div>
    ${rows}
    <div class="modal-actions" style="justify-content:flex-start;margin-top:10px">${acts.join('')}</div>`;
}
function bookFormHTML(ma, mode, p){
  const title = mode==='book' ? 'Đặt chỗ — nhập thông tin khách hàng' : 'Đăng ký giao dịch — ráp khách';
  const u = Perm.user()||{};
  const dvbhDefault = u.dvbh || (p.dvbh||'');
  return `<hr class="soft"><div class="section-title" style="font-size:13px">${title}</div>
    ${frow('Họ và tên KH',1,inpId('bkName', p.khName||'', 'Nhập tên khách hàng'))}
    ${frow('Số điện thoại',1,inpId('bkPhone','', '09xx xxx xxx'))}
    ${frow('CCCD/Hộ chiếu',0,inpId('bkCccd','', 'Số CCCD'))}
    ${frow('Tư vấn viên',0,inpId('bkTvv', u.name||'', 'TVV'))}
    ${frow('Đơn vị bán hàng',0,selId('bkDvbh', Store.get().dvbhList.slice().concat(dvbhDefault&&Store.get().dvbhList.indexOf(dvbhDefault)<0?[dvbhDefault]:[])))}
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="submitBooking('${ma}','${mode}')">${mode==='book'?'Tạo phiếu giữ chỗ':'Tạo YCDCO'}</button>
      <button class="btn btn-ghost" onclick="openProduct('${ma}')">Hủy</button>
    </div>`;
}
function submitBooking(ma, mode){
  const v=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const data={kh:v('bkName'), sdt:v('bkPhone'), cccd:v('bkCccd'), tvv:v('bkTvv'), dvbh:v('bkDvbh')};
  if(!data.kh){ toast('Vui lòng nhập tên khách hàng','warn'); return; }
  runWF(mode, ma, data);
}

/* ---- YCDCH ---- */
function ycdchBody(){
  const f=Filt.st('detail');
  const list=Store.get().ycdch.filter(y=>Perm.inScope(y.dvbh) && Filt.any(f.q, y.ma, y.kh, y.sdt, y.cccd, y.tvv, y.dvbh, y.san, y.productMa));
  const c=k=>list.filter(y=>y.status===k).length;
  return `<div style="display:flex;align-items:center;flex-wrap:wrap;background:#eef4ff;border:1px solid #d8e6fb;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:12.5px">
    ${statChip('Tổng',list.length,'#dbe7ff')}${statChip('Chờ ĐVBH XN',c('cho_xn'),'#FFE6C7')}${statChip('ĐVBH đã XN',0,'#FFF3D6')}${statChip('Giữ chỗ thành công',c('giu_cho'),'#FBC9C9')}${statChip('Đã ráp UT',c('da_rap'),'#DDD')}${statChip('Đề nghị hủy giữ chỗ',c('huy'),'#FFE2B8')}${statChip('Đã hoàn hủy chỗ',c('da_hoan'),'#D6F0DD')}
    <span style="margin-left:auto;display:flex;gap:18px"><a href="#" onclick="return false">⇄ Quy trình đặt chỗ &amp; thu tiền</a></span></div>
    <div style="overflow:auto"><table class="tbl"><thead><tr>
      <th>STT</th><th>Mã ⇅</th><th>Mã ERP</th><th>Mã PT</th><th>Trạng thái PT</th><th>Số tiền</th><th>Khách hàng ⇅</th><th>Số điện thoại</th><th>CCCD/HC</th><th>Tư vấn viên ⇅</th><th>Sàn</th><th>ĐVBH</th><th>Thời gian ⇅</th><th>Trạng thái ⇅</th><th>Hành động</th></tr></thead>
      <tbody>${list.map((r,i)=>`<tr><td>${i+1}</td><td class="code" onclick="openYCDCH('${r.ma}')">${r.ma}</td><td>${r.erp||''}</td><td>${r.pt||''}</td><td>${r.ttpt||''}</td><td>${r.tien||''}</td><td>${r.kh}</td><td>${r.sdt}</td><td>${r.cccd}</td><td>${r.tvv}</td><td>${r.san}</td><td>${r.dvbh}</td><td>${r.tg}</td><td>${stPill(ycLabel('YCDCH_ST',r.status))}</td>
        <td style="text-align:center">${r.status==='cho_xn'&&Perm.can('booking')?`<span style="color:#1f9d3d;cursor:pointer;font-weight:600" onclick="confirmHoldUI('${r.ma}')">✔ XN</span>`:`<span style="color:var(--blue2);cursor:pointer" onclick="openYCDCH('${r.ma}')">✎</span>`}</td></tr>`).join('')||`<tr><td colspan="15" style="text-align:center;color:#9aa3af;padding:40px">Không có YCDCH</td></tr>`}</tbody></table></div>
    ${pager('Hiển thị bản ghi từ 1 đến '+list.length,1)}`;
}
function confirmHoldUI(ma){ const r=Workflow.confirmHold(ma); toast(r.msg, r.ok?'':'err'); if(r.ok) App.rerender(); }

function openYCDCH(ma){
  const r=Store.get().ycdch.find(x=>x.ma===ma)||Store.get().ycdch[0]; if(!r) return;
  const cust=r.customerId?Store.customer(r.customerId):null;
  const sec=(t)=>`<div style="color:var(--blue2);font-weight:700;font-size:13px;margin:16px 0 8px">${t}</div>`;
  const kv=(k,v)=>`<div style="display:grid;grid-template-columns:230px 1fr;gap:8px;padding:5px 0;font-size:12.5px"><div style="color:#444">${k}</div><div style="font-weight:600">${v||''}</div></div>`;
  const up=(t)=>Uploader.imageBox(`ycdch:${r.ma}:${t}`, t);
  document.getElementById('modalRoot').innerHTML=`
  <div class="overlay" onclick="if(event.target===this)closeModal()">
   <div class="modal" style="width:860px">
    <div class="modal-h"><b>THÔNG TIN YÊU CẦU — ${r.ma}</b><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b" style="max-height:75vh;overflow:auto">
      <div style="text-align:right;margin-bottom:6px"><a href="#" onclick="toast('Đang in chứng từ...');return false">🖨 In chứng từ</a> &nbsp; <a href="#" onclick="return false">⬇</a></div>
      ${kv('Mã yêu cầu:',r.ma)}${kv('Trạng thái:',stPill(ycLabel('YCDCH_ST',r.status)))}
      ${sec('Thông tin nhân viên')}${kv('Tư vấn viên:',r.tvv)}${kv('Số CCCD/ Hộ chiếu:',r.cccd)}
      ${sec('Thông tin khách hàng')}
      ${kv('Họ và tên:',`<b>${r.kh}</b>`)}${kv('Giới tính:',(cust&&cust.gender)||'')}${kv('Ngày sinh:',(cust&&cust.dob)||'')}${kv('Điện thoại:',r.sdt)}${kv('Địa chỉ Email:',(cust&&cust.email)||'')}
      ${kv('Số CCCD/ Hộ chiếu:',r.cccd+((cust&&cust.ngayCap)?(' &nbsp;&nbsp; Ngày cấp: '+cust.ngayCap):''))}${kv('Nơi cấp:',(cust&&cust.noiCap)||'')}
      ${kv('Địa chỉ thường trú:',(cust&&cust.diaChi)||'Việt Nam')}
      ${sec('CC/CCCD/Hộ chiếu')}<div style="display:flex;gap:14px">${up('Mặt trước CCCD')}${up('Mặt sau CCCD')}${up('Căn cước điện tử')}</div>
      ${sec('Thông tin dự án')}${kv('Loại bất động sản:','Căn hộ')}${kv('Dự án:','Dự án đào tạo Đợt 1')}${kv('Sản phẩm:',r.productMa||'—')}${kv('Số tiền đăng ký:',(r.tien||'100.000.000')+' VNĐ')}
      <div class="modal-actions">
        ${r.status==='cho_xn'&&Perm.can('booking')?`<button class="btn btn-primary" onclick="confirmHoldUI('${r.ma}');closeModal()">✔ Xác nhận giữ chỗ</button>`:''}
        <button class="btn btn-ghost" onclick="closeModal()">Đóng</button>
      </div>
    </div>
   </div>
  </div>`;
}

/* ---- YCDCO ---- */
function ycdcoBody(){
  const f=Filt.st('detail');
  const list=Store.get().ycdco.filter(y=>Perm.inScope(y.dvbh) && Filt.any(f.q, y.ma, y.kh, y.sdt, y.tvv, y.dvbh, y.productMa, y.hd));
  return `<div style="display:flex;align-items:center;background:#eef4ff;border:1px solid #d8e6fb;border-radius:8px;padding:12px 16px;margin-bottom:14px">
    <b style="color:var(--orange);font-size:14px">${list.length} yêu cầu</b><a href="#" onclick="return false" style="margin-left:auto">⇄ Quy trình đặt cọc &amp; thu tiền</a></div>
    <div style="overflow:auto"><table class="tbl"><thead><tr><th>STT</th><th>Mã ⇅</th><th>Số HĐ</th><th>Mã SP</th><th>Khách hàng ⇅</th><th>Số điện thoại</th><th>Tư vấn viên ⇅</th><th>Sàn</th><th>ĐVBH</th><th>Thời gian ⇅</th><th>Trạng thái ⇅</th><th>Hành động</th></tr></thead>
    <tbody>${list.map((r,i)=>`<tr><td>${i+1}</td><td class="code">${r.ma}</td><td>${r.hd?`<span class="code">${r.hd}</span>`:''}</td><td>${r.productMa?`<span class="code" onclick="openProduct('${r.productMa}')">${r.productMa}</span>`:''}</td><td>${r.kh}</td><td>${r.sdt}</td><td>${r.tvv}</td><td>${r.san}</td><td>${r.dvbh}</td><td>${r.tg}</td><td>${stPill(ycLabel('YCDCO_ST',r.status))}</td>
      <td style="text-align:center">${r.status==='cho_kt'&&r.productMa&&Perm.can('accounting.approve')?`<span style="color:#1f9d3d;cursor:pointer;font-weight:600" onclick="runWF('confirmcoc','${r.productMa}')">XN cọc</span>`:'_'}</td></tr>`).join('')||`<tr><td colspan="12" style="text-align:center;color:#9aa3af;padding:40px">Không có YCDCO</td></tr>`}</tbody></table></div>
    ${pager('Hiển thị bản ghi từ 1 đến '+list.length,1)}`;
}

/* ---- Danh sách giao dịch ---- */
function giaodichBody(){
  const active=['giu_cho','dat_cho','dvbh_khac','dang_ky','kiem_tra','cho_duyet','da_coc','hop_dong'];
  const fq=Filt.st('detail');
  const rows=Store.products().filter(p=>active.indexOf(p.status)>=0 && Perm.inScope(p.dvbh) && Filt.any(fq.q, p.ma, p.khName, p.dvbh, p.loai));
  const tudo = rows.length;
  const byStatus={}; CFG.PSTATUS_ORDER.forEach(k=>byStatus[k]=0); rows.forEach(p=>byStatus[p.status]++);
  const chips=['giu_cho','dat_cho','dvbh_khac','dang_ky','kiem_tra','cho_duyet','da_coc'].map(k=>{const d=CFG.PSTATUS[k];const border=d.grid==='#FFFFFF'?'border:1px solid #ddd':'';return `<span class="sw" title="${d.label}" style="background:${d.grid};${border};${d.dark?'color:#fff':''};min-width:28px">${byStatus[k]||0}</span>`;}).join('');
  return `<div style="display:flex;align-items:center;gap:18px;justify-content:flex-end;margin-bottom:10px">
      <label class="chk" style="margin:0"><input type="checkbox"> Sắp xếp theo màu</label><a href="#" onclick="App.rerender();return false">↻ Làm mới</a></div>
    <div style="background:#fafbfd;border:1px solid var(--line);border-radius:8px;padding:10px 14px;margin-bottom:10px">
      <b>Danh sách sản phẩm đang giao dịch:</b> <b>${tudo}</b> &nbsp; ${chips}</div>
    <div style="overflow:auto"><table class="tbl"><thead><tr><th>Hành động</th><th>Mã sản phẩm ⇅</th><th>Giá chưa VAT ⇅</th><th>Giá có VAT ⇅</th><th>Khách hàng ⇅</th><th>Đơn vị bán hàng ⇅</th><th>Trạng thái ⇅</th><th>Block</th><th>Tầng/Lô</th></tr></thead>
    <tbody>${rows.map(p=>{const d=CFG.PSTATUS[p.status];const tint=d.pill.split(';')[0];const act=(p.status==='cho_duyet'||p.status==='kiem_tra')&&Perm.can('contract.manage')?`<a href="#" onclick="runWF('${p.status==='kiem_tra'?'kdreview':'confirmcoc'}','${p.ma}');return false">${p.status==='kiem_tra'?'Duyệt':'XN cọc'}</a> &nbsp; <a href="#" onclick="runWF('reclaim','${p.ma}');return false">Thu hồi</a>`:'';
      const cd=(p.holdUntil&&(p.status==='giu_cho'||p.status==='dang_ky'))?` <b data-countdown="${p.holdUntil}" style="color:var(--red);font-size:11px">${Queue.fmt(Queue.remaining(p))}</b>`:'';
      const qn=(p.queue&&p.queue.length>1)?` <span style="color:var(--muted);font-size:11px">(${p.queue.length} UT)</span>`:'';
      return `<tr style="background:${tint}"><td style="white-space:nowrap">${act}</td><td><b class="code" onclick="openProduct('${p.ma}')">${p.ma}</b></td><td>${fmtVN(p.giaCB)} VNĐ</td><td>${fmtVN(p.giaVAT)} VNĐ</td><td>${p.khName||''}</td><td>${p.dvbh||''}</td><td>${pPill(p.status)}${cd}${qn}</td><td>${p.block}</td><td>${p.tang}.${p.lo}</td></tr>`;}).join('')||`<tr><td colspan="9" style="text-align:center;color:#9aa3af;padding:40px">Chưa có giao dịch</td></tr>`}</tbody></table></div>`;
}

/* ---- Dashboard ---- */
function dashBody(){ return dashboardHTML(); }
function dashLegend(items){return `<div style="display:flex;flex-wrap:wrap;gap:6px 18px;margin:6px 0 18px;font-size:11.5px;color:#39424f">
  ${items.map(i=>`<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:${i[0]}"></span>${i[1]}</span>`).join('')}</div>`;}
function hbarChart(rows,maxX,ticks){
  const n=ticks.length-1;
  const grid=`background-image:repeating-linear-gradient(to right,#eef1f5 0,#eef1f5 1px,transparent 1px,transparent calc(100%/${n}));background-position:left top;background-repeat:repeat`;
  const labels=rows.map(r=>`<div style="height:32px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:11.5px;color:#5b6573">${r[2]||r[0]}</div>`).join('');
  const bars=rows.map(r=>`<div style="height:32px;display:flex;align-items:center"><div style="height:22px;width:${Math.max(r[0]/maxX*100,0.3)}%;background:${r[1]};border-radius:0 3px 3px 0"></div><span style="font-size:10px;color:#5b6573;margin-left:6px">${r[0]}</span></div>`).join('');
  return `<div><div style="display:flex"><div style="width:120px;flex-shrink:0">${labels}</div><div style="flex:1;position:relative;${grid}">${bars}</div></div>
    <div style="display:flex;padding-top:6px"><div style="width:120px;flex-shrink:0"></div><div style="flex:1;display:flex;justify-content:space-between;font-size:10.5px;color:#9aa3af">${ticks.map(t=>`<span>${t}</span>`).join('')}</div></div></div>`;
}
function vStackChart(cats,maxY,yTicks){
  const H=240, barW=56;
  const yaxis=`<div style="display:flex;flex-direction:column;justify-content:space-between;height:${H}px;width:36px;text-align:right;padding-right:8px;font-size:10.5px;color:#9aa3af">${yTicks.slice().reverse().map(t=>`<span>${t}</span>`).join('')}</div>`;
  const grid=`<div style="position:absolute;left:0;right:0;top:0;height:${H}px;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none">${yTicks.map(()=>`<div style="height:1px;background:#eef1f5"></div>`).join('')}</div>`;
  const col=(c)=>{ const colH=c.total/maxY*H;
    const segs=c.segs.map(s=>`<div style="width:100%;height:${(s[0]/c.total*colH).toFixed(1)}px;background:${s[1]}"></div>`).reverse().join('');
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:${H}px;min-width:0">
        <div style="font-size:11px;font-weight:600;color:#5b6573;margin-bottom:3px">${c.total}</div>
        <div style="width:${barW}px;max-width:78%;display:flex;flex-direction:column">${segs}</div></div>`;};
  const xlabels=cats.map(c=>`<div style="flex:1;text-align:center;font-size:11px;color:#5b6573;white-space:nowrap;min-width:0">${c.label||''}</div>`).join('');
  return `<div style="display:flex">${yaxis}<div style="flex:1;position:relative">${grid}
     <div style="display:flex;align-items:flex-end;height:${H}px;gap:12px;position:relative">${cats.map(col).join('')}</div>
     <div style="display:flex;gap:12px;padding-top:8px">${xlabels}</div></div></div>`;
}
function dashboardHTML(){
  const counts=Store.statusCounts(p=>p.ctbhId==='CTBH1');
  const statusRows=CFG.PSTATUS_ORDER.filter(k=>counts[k]>0).sort((a,b)=>counts[b]-counts[a])
    .map(k=>[counts[k],CFG.PSTATUS[k].grid,CFG.PSTATUS[k].label]);
  const maxX=Math.max(...statusRows.map(r=>r[0]),10);
  const ticks=[0,Math.round(maxX*.25),Math.round(maxX*.5),Math.round(maxX*.75),maxX];
  const statusLegend=CFG.PSTATUS_ORDER.map(k=>[CFG.PSTATUS[k].grid,CFG.PSTATUS[k].label]);
  // theo loại
  const types=['Studio','Căn 2PN','Căn 3PN'];
  const segColors=['mo_ban','dang_ky','da_coc','hop_dong'].map(k=>CFG.PSTATUS[k].grid);
  const typeCats=types.map(t=>{
    const ps=Store.products().filter(p=>p.ctbhId==='CTBH1'&&p.loai===t);
    const total=ps.length||1;
    const mob=ps.filter(p=>p.status==='chua_mo_ban'||p.status==='mo_ban').length;
    const dk=ps.filter(p=>['giu_cho','dat_cho','dang_ky','kiem_tra','cho_duyet'].indexOf(p.status)>=0).length;
    const coc=ps.filter(p=>p.status==='da_coc').length;
    const hd=ps.filter(p=>p.status==='hop_dong').length;
    return {label:t,total,segs:[[mob,segColors[0]],[dk,segColors[1]],[coc,segColors[2]],[hd,segColors[3]]]};
  });
  const maxY=Math.max(...typeCats.map(c=>c.total),10);
  const yT=[0,Math.round(maxY*.25),Math.round(maxY*.5),Math.round(maxY*.75),maxY];
  const typeLegend=[['mo_ban','Tồn kho/Mở bán'],['dang_ky','Đang giao dịch'],['da_coc','Đã cọc'],['hop_dong','Hợp đồng']].map(x=>[CFG.PSTATUS[x[0]].grid,x[1]]);
  const head=(t)=>`<div style="display:flex;align-items:center;justify-content:space-between"><div style="font-weight:700;color:#2a3340;font-size:13.5px;text-transform:uppercase;letter-spacing:.3px">${t}</div><span style="color:#b6bcc6;font-size:18px;letter-spacing:1px">⋯</span></div>`;
  return `
   <div class="card">${head('Báo cáo theo trạng thái sản phẩm')}${dashLegend(statusLegend)}${hbarChart(statusRows,maxX,ticks)}</div>
   <div class="card" style="margin-top:18px">${head('Báo cáo theo loại sản phẩm')}${dashLegend(typeLegend)}${vStackChart(typeCats,maxY,yT)}</div>`;
}

/* ---- Hướng dẫn quy trình (giữ nguyên 2 swimlane như v3) ---- */
function box(text,color,shape){
  const c={y:'#FCE9A8',p:'#C9B6F0',b:'#CFE3FA',o:'#F0894A',r:'#F07A6E',g:'#E8EEF7',w:'#fff'}[color]||'#fff';
  if(shape==='d') return `<div style="background:${c};width:96px;height:96px;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;margin:8px auto;border:1px solid rgba(0,0,0,.12)"><span style="transform:rotate(-45deg);font-size:11px;text-align:center">${text}</span></div>`;
  const txtcol=(color==='o'||color==='r')?'#fff':'#222';
  return `<div style="background:${c};color:${txtcol};border:1px solid rgba(0,0,0,.12);border-radius:6px;padding:10px 12px;margin:8px auto;font-size:11.5px;text-align:center;line-height:1.4;max-width:230px">${text}</div>`;
}
const ARR=`<div style="text-align:center;color:#888;font-size:16px;line-height:1">↓</div>`;
function lane(boxesHTML){return `<div style="flex:1;min-width:200px;padding:0 6px">${boxesHTML}</div>`;}
function swimHead(lanes){return `<div style="display:flex;border:1px solid var(--line);background:#f3f6fb;border-radius:8px 8px 0 0">${lanes.map(l=>`<div style="flex:1;min-width:200px;text-align:center;font-weight:700;padding:12px 6px;border-right:1px solid var(--line);font-size:12.5px">${l}</div>`).join('')}</div>`;}
function quytrinhBody(){
  const p1Lanes=['Đại lý','Hệ thống','Sales Admin','TPKD / PGDKD','Kế toán'];
  const L1=lane(box('DANH SÁCH GIAO DỊCH<br>Xem sản phẩm','y')+ARR+box('Bấm Nút Đăng Ký','p')+ARR+box('Chọn KH vãng lai','p')+ARR+box('Nhập thông tin Khách hàng','w')+ARR+box('Bấm Lưu thông tin','p')+ARR+box('Bấm Nút Xác nhận','p')+ARR+box('IN / TẢI FILE<br>Phiếu YC tư vấn · Đơn ĐKNV','b')+ARR+box('Chuyển hồ sơ KH','w'));
  const L2=lane(box('Trả về','y')+`<div style="text-align:center;font-size:10px;color:#888;margin:4px 0">↑ Hết giờ tự trả</div>`+box('Hết thời gian ?','p','d'));
  const L3=lane(box('Thông báo đầy đủ hồ sơ','b')+ARR+box('Điền cột Ghi chú "Đủ hồ sơ"','b')+ARR+box('Đính kèm file scan chứng từ','w')+ARR+box('Đầy đủ ?','y','d')+ARR+box('Kiểm tra hồ sơ Đại lý','w'));
  const L4=lane(box('DANH SÁCH GIAO DỊCH','b')+ARR+box('Bấm Nút Xác nhận GD','o')+ARR+box('Chuyển hồ sơ kế toán','b'));
  const L5=lane(box('Kiểm tra tiền ngân hàng','b')+ARR+box('Bấm Duyệt phiếu thu','b')+ARR+box('IN PHIẾU THU TIỀN','b')+ARR+box('Hoàn thành hồ sơ thu','g'));
  const p1=`<div style="display:flex;border:1px solid var(--line);border-top:none;border-radius:0 0 8px 8px;padding:14px 0;overflow:auto">${L1}${L2}${L3}${L4}${L5}</div>`;
  const p2Lanes=['Đại lý','Sales Admin','TPBH','PTKD','Kế toán'];
  const Q1=lane(box('Bấm Yêu cầu Hủy ĐKNV<br>Chuyển hồ sơ về Futaland','w'));
  const Q3=lane(box('Thu hồi Mã căn cần hoàn tiền','b')+ARR+box('Duyệt YC Hoàn Tiền','b')+ARR+box('Đối chiếu thông tin và Bấm Duyệt','b'));
  const Q5=lane(`<div style="height:200px"></div>`+box('Nhận Đề Nghị Hoàn Tiền<br>Chuyển tiền + Xác nhận hoàn','b'));
  const p2=`<div style="display:flex;border:1px solid var(--line);border-top:none;border-radius:0 0 8px 8px;padding:14px 0;overflow:auto">${Q1}${lane('')}${Q3}${lane('')}${Q5}</div>`;
  return `<h2 style="text-align:right;color:var(--orange);font-size:22px;margin:6px 0 14px">QUY TRÌNH ĐẶT CHỖ &amp; THU TIỀN</h2>
    ${swimHead(p1Lanes)}${p1}
    <h2 style="text-align:right;color:var(--orange);font-size:22px;margin:30px 0 14px">QUY TRÌNH HỦY CHỖ &amp; HOÀN TIỀN</h2>
    ${swimHead(p2Lanes)}${p2}`;
}

/* ---- Cập nhật giá / Tải nhập / Công bố giá (giữ UI gốc, có hiệu lực) ---- */
function updatePrice(){
  const f=document.createElement('input'); f.type='file'; f.accept='.xlsx,.xls';
  f.onchange=()=>toast('Đã tải lên file cập nhật giá — đang xử lý...'); f.click();
}
/* Tải nhập bảng hàng thật (Excel/CSV) — xem importer.js */
function openImport(){ Importer.openImport(); }
let publishList=[['A-05.02','KHO SẢN PHẨM','Chưa mở bán'],['A-05.04','KHO SẢN PHẨM','Chưa mở bán']];
function openPublish(){ renderPublish(); }
function renderPublish(){
  document.getElementById('modalRoot').innerHTML=`
  <div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="width:720px">
    <div class="modal-h"><b>Công bố giá</b><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <select id="pubSel" class="inp" style="flex:1">${['A-05.01','A-05.03','A-05.05','A-05.06'].map(o=>`<option>${o}</option>`).join('')}</select>
        <button class="btn btn-primary" onclick="addPublish()">Thêm vào</button></div>
      <div style="font-size:12.5px;margin-bottom:6px">Tổng sản phẩm chọn: <a href="#" onclick="return false">${publishList.length} sản phẩm</a></div>
      <table class="tbl" style="box-shadow:none"><thead><tr><th>Mã sản phẩm</th><th>Đơn vị đang sở hữu</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>${publishList.map((r,i)=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td style="text-align:center"><span style="color:#b0b6c0;cursor:pointer" onclick="rmPublish(${i})">✕</span></td></tr>`).join('')}</tbody></table>
      <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal();toast('Đã công bố giá '+${publishList.length}+' sản phẩm')">Công bố giá</button>
        <button class="btn btn-ghost" onclick="closeModal()">Hủy bỏ</button></div>
    </div></div></div>`;
}
function addPublish(){ const v=document.getElementById('pubSel').value; if(!publishList.find(r=>r[0]===v)) publishList.push([v,'KHO SẢN PHẨM','Chưa mở bán']); renderPublish(); }
function rmPublish(i){ publishList.splice(i,1); renderPublish(); }
