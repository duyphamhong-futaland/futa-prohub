/* ============================================================
   FUTA Land — Prohub  ·  screens-erp.js
   (1) ĐỒNG BỘ ERP — đẩy chứng từ tài chính (phiếu thu / hoàn tiền) sang
       ERP: gán Mã chứng từ (BCO…), định khoản (bút toán), idempotent
       (đã gán mã thì không đồng bộ lại), nhật ký + đối soát.
   (2) THÔNG BÁO DXHOME — CMS soạn & gửi thông báo xuống app field.
   ============================================================ */
window.SCREENS = window.SCREENS || {};

/* ===================== ĐỒNG BỘ ERP ===================== */
const ERP = (function(){
  function acctPt(loai){ return loai==='Yêu cầu đặt cọc' ? 'Nợ 112 / Có 3387 (cọc)' : 'Nợ 112 / Có 131'; }
  function docs(){
    const st=Store.get(); const out=[];
    st.payReqs.filter(r=>r.status==='da_duyet').forEach(r=>out.push({kind:'pt', id:r.ma, type:'Thu tiền',
      kh:r.kh, sp:r.sp, duAn:r.duAn, amount:r.soTien||'0', erpCode:r.chungTu||'', acct:acctPt(r.loaiPhieu), ngay:r.ngayTao}));
    (st.refunds||[]).filter(r=>r.status==='da_hoan').forEach(r=>out.push({kind:'ht', id:r.id, type:'Chi hoàn tiền',
      kh:r.kh, sp:r.productMa, duAn:'', amount:r.soTien||'0', erpCode:r.erpCode||'', acct:'Nợ 3387 / Có 112', ngay:r.ngayTao}));
    return out;
  }
  function pending(){ return docs().filter(d=>!d.erpCode); }
  function synced(){ return docs().filter(d=>d.erpCode); }
  function stats(){ const all=docs(); const sum=a=>a.reduce((s,d)=>s+parseVN(d.amount),0);
    const sy=all.filter(d=>d.erpCode), pe=all.filter(d=>!d.erpCode);
    return {syncN:sy.length, syncV:sum(sy), penN:pe.length, penV:sum(pe), errN:0}; }
  function apply(st, d, code, at){
    if(d.kind==='pt'){ const r=st.payReqs.find(x=>x.ma===d.id); if(r){ r.chungTu=code; r.erpAt=at; } }
    else { const r=(st.refunds||[]).find(x=>x.id===d.id); if(r){ r.erpCode=code; r.erpAt=at; } }
  }
  function logRow(st, d, code, at){ st.erpLog=st.erpLog||[]; st.erpLog.unshift({at, by:(Store.currentUser()||{}).name||'', docId:d.id, erpCode:code, amount:d.amount, acct:d.acct}); }
  function syncOne(kind,id){ if(!Perm.guard('erp.sync'))return;
    Store.mutate(st=>{ const d=docs().find(x=>x.kind===kind&&x.id===id); if(!d||d.erpCode) return;
      const code=Store.nextCode('erp','BCO202606',4); const at=new Date().toLocaleString('vi-VN');
      apply(st,d,code,at); logRow(st,d,code,at); Store.audit('Đồng bộ ERP '+id+' → '+code, id); });
    toast('Đã đồng bộ '+id+' lên ERP ✓'); App.rerender();
  }
  function syncAll(){ if(!Perm.guard('erp.sync'))return; const pend=pending(); if(!pend.length){ toast('Không có chứng từ chờ đồng bộ','warn'); return; }
    Store.mutate(st=>{ pend.forEach(d=>{ const code=Store.nextCode('erp','BCO202606',4); const at=new Date().toLocaleString('vi-VN'); apply(st,d,code,at); logRow(st,d,code,at); });
      Store.audit('Đồng bộ ERP hàng loạt: '+pend.length+' chứng từ', ''); });
    toast('Đã đồng bộ '+pend.length+' chứng từ lên ERP ✓'); App.rerender();
  }
  return { docs, pending, synced, stats, syncOne, syncAll };
})();

let erpTab='pending';
function setErpTab(t){ erpTab=t; App.renderContent(); }
SCREENS['erp-sync']=()=>{
  const s=ERP.stats();
  const kpi=(l,v,c)=>`<div class="card" style="flex:1;min-width:170px"><div style="font-size:12px;color:var(--muted)">${l}</div><div style="font-size:21px;font-weight:800;color:${c};margin-top:4px">${v}</div></div>`;
  const tabs=[['pending','Chờ đồng bộ ('+s.penN+')'],['synced','Đã đồng bộ ('+s.syncN+')'],['log','Nhật ký đồng bộ'],['map','Cấu hình ánh xạ']];
  return `<div class="page-title">ĐỒNG BỘ ERP</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
      ${kpi('Đã đồng bộ', s.syncN+' CT · '+fmtVN(s.syncV)+' đ', '#1f9d3d')}
      ${kpi('Chờ đồng bộ', s.penN+' CT · '+fmtVN(s.penV)+' đ', '#E07A1E')}
      ${kpi('Lỗi đồng bộ', s.errN, '#d0392b')}
      <div class="card" style="flex:1;min-width:200px;display:flex;align-items:center;justify-content:center">
        ${Perm.can('erp.sync')&&s.penN?`<button class="btn btn-primary" onclick="ERP.syncAll()">⟳ Đồng bộ tất cả (${s.penN})</button>`:'<span style="color:#9aa3af">Đã đồng bộ đầy đủ</span>'}</div>
    </div>
    <div class="tabs">${tabs.map(t=>`<div class="tab ${erpTab===t[0]?'active':''}" onclick="setErpTab('${t[0]}')">${t[1]}</div>`).join('')}</div>
    <div style="margin-top:14px">${erpBody()}</div>`;
};
function erpBody(){
  if(erpTab==='log') return erpLogTable();
  if(erpTab==='map') return erpMapping();
  const list=erpTab==='synced'?ERP.synced():ERP.pending();
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th>Loại</th><th>Chứng từ Prohub</th><th>Dự án / SP</th><th>Khách hàng</th><th>Số tiền</th><th>Định khoản (Nợ/Có)</th><th>Mã chứng từ ERP</th><th>Trạng thái</th>${erpTab==='pending'?'<th>Hành động</th>':''}</tr></thead>
    <tbody>${list.map(d=>`<tr>
      <td>${d.type}</td><td class="code">${d.id}</td><td style="white-space:nowrap">${d.sp||d.duAn||''}</td><td>${d.kh}</td>
      <td style="white-space:nowrap">${d.amount} đ</td><td style="white-space:nowrap">${d.acct}</td>
      <td>${d.erpCode?`<span class="code">${d.erpCode}</span>`:'<span style="color:#9aa3af">—</span>'}</td>
      <td>${d.erpCode?'<span class="tag-ok">Đã đồng bộ</span>':'<span class="badge-status bg-wait">Chờ đồng bộ</span>'}</td>
      ${erpTab==='pending'?`<td>${Perm.can('erp.sync')?`<button class="btn btn-ghost btn-sm" onclick="ERP.syncOne('${d.kind}','${d.id}')">Đồng bộ</button>`:''}</td>`:''}</tr>`).join('')
      ||`<tr><td colspan="9" style="text-align:center;color:#9aa3af;padding:34px">${erpTab==='pending'?'Tất cả chứng từ đã được đồng bộ':'Chưa có chứng từ đã đồng bộ'}</td></tr>`}</tbody></table></div>`;
}
function erpLogTable(){ const log=Store.get().erpLog||[];
  return `<div style="overflow:auto"><table class="tbl"><thead><tr><th>Thời gian</th><th>Người đồng bộ</th><th>Chứng từ Prohub</th><th>Mã chứng từ ERP</th><th>Số tiền</th><th>Định khoản</th></tr></thead>
    <tbody>${log.map(l=>`<tr><td style="white-space:nowrap">${l.at}</td><td>${l.by}</td><td class="code">${l.docId}</td><td class="code">${l.erpCode}</td><td style="white-space:nowrap">${l.amount} đ</td><td style="white-space:nowrap">${l.acct}</td></tr>`).join('')||`<tr><td colspan="6" style="text-align:center;color:#9aa3af;padding:34px">Chưa có nhật ký đồng bộ</td></tr>`}</tbody></table></div>`;
}
function erpMapping(){
  const rows=[['Thu đặt cọc (YCDCO)','Nợ 112 / Có 3387','Tiền cọc → doanh thu chưa thực hiện'],
    ['Thu theo hợp đồng (đợt TT)','Nợ 112 / Có 131','Giảm công nợ phải thu khách hàng'],
    ['Ghi nhận doanh thu (xuất HĐ)','Nợ 131 / Có 511, 3331','Doanh thu bán BĐS + VAT đầu ra 10%'],
    ['Hoàn tiền cọc','Nợ 3387 / Có 112','Trả lại tiền cọc cho khách'],
    ['Thu phí bảo trì (KPBT 2%)','Nợ 112 / Có 3388','Thu hộ quỹ bảo trì chung cư']];
  return `<div class="card"><div class="section-title">Ánh xạ nghiệp vụ Prohub → bút toán ERP</div>
    <div style="overflow:auto"><table class="tbl" style="box-shadow:none"><thead><tr><th>Nghiệp vụ Prohub</th><th>Định khoản (Nợ / Có)</th><th>Diễn giải</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td style="font-weight:600;white-space:nowrap">${r[0]}</td><td class="code" style="white-space:nowrap">${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
    <div class="note-bar" style="margin-top:14px">🔒 <b>Toàn vẹn tài chính:</b> mỗi chứng từ chỉ ghi sổ <b>1 lần</b> (idempotent) — đã gán Mã chứng từ ERP thì không đồng bộ lại. Đối soát 2 chiều theo <b>Mã chứng từ + số tiền</b>. Mọi lần đồng bộ đều ghi <b>nhật ký (ai · lúc nào)</b>.</div></div>`;
}

/* ===================== THÔNG BÁO DXHOME ===================== */
const DX = (function(){
  function list(){ return Store.get().dxhome||[]; }
  function create(d){ Store.mutate(st=>{ const id=Store.nextCode('dx','TB-',4);
    (st.dxhome=st.dxhome||[]).unshift({id, title:d.title, body:d.body, target:d.target, schedule:d.schedule||'', status:'draft', createdAt:new Date().toLocaleString('vi-VN'), reach:0});
    Store.audit('Soạn thông báo DxHome: '+d.title, id); }); toast('Đã lưu thông báo (nháp)'); App.rerender(); }
  function send(id){ if(!Perm.guard('dxhome'))return; Store.mutate(st=>{ const a=(st.dxhome||[]).find(x=>x.id===id); if(!a) return;
    a.status='sent'; a.sentAt=new Date().toLocaleString('vi-VN'); a.reach=a.target==='ĐVBH'?124:a.target==='Khách hàng'?860:984;
    Store.notify('[DxHome] '+a.title, 'Khác', 'DxHome'); Store.audit('Gửi thông báo DxHome: '+a.title, id); });
    toast('Đã gửi thông báo DxHome xuống app field 📤'); App.rerender(); }
  return { list, create, send };
})();
SCREENS['dxhome']=()=>{
  const list=DX.list();
  return `<div class="toolbar"><div class="page-title" style="margin:0">QUẢN LÝ THÔNG BÁO DXHOME</div><div class="spacer"></div>
    ${Perm.can('dxhome')?`<button class="btn btn-primary" onclick="openDxCompose()">＋ Soạn thông báo</button>`:''}</div>
    <div class="note-bar">Thông báo gửi xuống <b>app DxHome</b> (kênh ĐVBH / khách hàng): mở bán, đổi giá, khuyến mãi… Theo dõi lượt nhận.</div>
    <div style="overflow:auto"><table class="tbl"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Nội dung</th><th>Đối tượng</th><th>Lịch / Thời điểm gửi</th><th>Trạng thái</th><th>Lượt nhận</th><th>Hành động</th></tr></thead>
    <tbody>${list.map(a=>`<tr><td class="code">${a.id}</td><td style="font-weight:600;white-space:nowrap">${a.title}</td><td style="max-width:300px">${a.body}</td><td>${a.target}</td><td style="white-space:nowrap">${a.schedule||a.sentAt||'—'}</td><td>${a.status==='sent'?'<span class="tag-ok">Đã gửi</span>':'<span class="badge-status bg-wait">Nháp</span>'}</td><td>${a.reach||0}</td><td>${a.status!=='sent'&&Perm.can('dxhome')?`<button class="btn btn-ghost btn-sm" onclick="DX.send('${a.id}')">📤 Gửi ngay</button>`:''}</td></tr>`).join('')
      ||`<tr><td colspan="8" style="text-align:center;color:#9aa3af;padding:34px">Chưa có thông báo</td></tr>`}</tbody></table></div>`;
};
function openDxCompose(){
  document.getElementById('modalRoot').innerHTML=`
  <div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="width:620px">
    <div class="modal-h"><b>Soạn thông báo DxHome</b><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      ${frow('Tiêu đề',1,inpId('dxTitle','','Tiêu đề thông báo'))}
      ${frow('Nội dung',1,`<textarea id="dxBody" class="inp" placeholder="Nội dung gửi tới app DxHome"></textarea>`)}
      ${frow('Đối tượng nhận',1,selId('dxTarget',['Tất cả','ĐVBH','Khách hàng']))}
      ${frow('Lịch gửi',0,inpId('dxSchedule','','dd/mm/yyyy hh:mm — để trống = gửi ngay'))}
      <div style="font-weight:600;margin:10px 0 4px">Ảnh banner</div>
      ${bigUpload('Tải ảnh banner','.jpg .png ≤ 5MB','dxhome-banner')}
      <div class="modal-actions" style="justify-content:flex-end"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button><button class="btn btn-primary" onclick="submitDx()">Lưu nháp</button></div>
    </div></div></div>`;
}
function submitDx(){ const v=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const title=v('dxTitle'); if(!title){ toast('Nhập tiêu đề','warn'); return; }
  DX.create({title, body:v('dxBody'), target:v('dxTarget'), schedule:v('dxSchedule')}); closeModal();
}
