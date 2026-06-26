/* ============================================================
   FUTA Land — Prohub  ·  screens-payments.js
   Thanh toán + Kế toán: đề nghị thu tiền, duyệt phiếu thu, phiếu thu /
   phiếu chi, hoàn tiền. Đọc Store.payReqs; duyệt ghi qua Workflow.
   ============================================================ */
window.SCREENS = window.SCREENS || {};

let curReq=null, curReqFee=false;
function openReq(ma,fee){ curReq=ma; curReqFee=!!fee; go('req-detail'); }
function ptLabel(k){ return CFG.PT_ST[k]||k; }
function ptPill(k){
  const map={khoi_tao:'#E2F6E6;color:#1f9d3d',cho_duyet:'#FFF3D6;color:#a9820a',da_duyet:'#E6F0FF;color:#1565d8',tu_choi:'#FBDADA;color:#c0392b'};
  return `<span style="background:${map[k]||'#eef0f3;color:#555'};padding:3px 9px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap">${ptLabel(k)}</span>`;
}
function approvePayUI(ma){ if(!Perm.guard('accounting.approve'))return; const r=Workflow.approvePayment(ma); toast(r.msg,r.ok?'':'err'); if(r.ok) App.rerender(); }

function reqTable(list, fee, withApprove){
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th style="width:34px"><input type="checkbox"></th><th>Hành động</th><th>Dự án</th><th>Mã đề nghị <span class="sort">⇅</span></th><th>Loại phiếu thu <span class="sort">⇅</span></th><th>Họ tên khách hàng</th><th>Sàn</th><th>Số tiền</th><th>Trạng thái <span class="sort">⇅</span></th><th>Ngày tạo <span class="sort">⇅</span></th><th>Mã chứng từ</th><th>Mã YC/HD</th><th>Mã SP</th></tr></thead>
    <tbody>${list.map(r=>`<tr>
      <td><input type="checkbox"></td>
      <td style="text-align:center;white-space:nowrap">
        <span title="In phiếu" style="color:var(--blue2);cursor:pointer;font-size:15px" onclick="event.stopPropagation();toast('Đang in ${r.ma}...')">🖨</span>
        ${withApprove&&r.status==='cho_duyet'&&Perm.can('accounting.approve')?` <a href="#" onclick="approvePayUI('${r.ma}');return false">Duyệt</a>`:''}</td>
      <td style="white-space:nowrap">${r.duAn}</td><td class="code" onclick="openReq('${r.ma}',${fee?'true':'false'})">${r.ma}</td><td>${r.loaiPhieu}</td>
      <td style="white-space:nowrap">${r.kh}</td><td style="white-space:nowrap">${r.san}</td><td style="white-space:nowrap">${r.soTien||''}</td><td>${ptPill(r.status)}</td>
      <td style="white-space:nowrap">${r.ngayTao}</td><td>${r.chungTu||''}</td><td>${r.ycHd?`<span class="code">${r.ycHd}</span>`:''}</td><td>${r.sp||''}</td></tr>`).join('')||`<tr><td colspan="13" style="text-align:center;color:#9aa3af;padding:40px">Không có đề nghị</td></tr>`}</tbody></table></div>`;
}
function reqDetail(ma,showFee){
  const r=Store.get().payReqs.find(x=>x.ma===ma)||Store.get().payReqs[0];
  if(!r) return emptyState('Không tìm thấy phiếu');
  const ngayCN=(r.ngayTao||'').split(' ')[0];
  const kv=(k,v)=>`<div style="display:grid;grid-template-columns:200px 1fr;gap:10px;padding:6px 0;font-size:12.5px"><div style="color:#444">${k}</div><div style="font-weight:600">${v||''}</div></div>`;
  return `
   <div class="save-row">
     ${r.status==='cho_duyet'&&Perm.can('accounting.approve')?`<button class="btn btn-primary" onclick="approvePayUI('${ma}')">✔ Duyệt phiếu thu</button>`:''}
     <button class="btn btn-primary" onclick="toast('Mở chỉnh sửa phiếu ${ma}')">Chỉnh sửa</button>
     <button class="btn btn-ghost" onclick="go(curReqFee?'req-done':'req-list')">↩ Quay lại</button></div>
   <div class="card" style="padding:0;overflow:hidden">
     <div class="section-title" style="padding:16px 18px 6px">Thông tin</div>
     <div style="overflow:auto;padding:0 6px">
      <table class="tbl" style="box-shadow:none"><thead><tr><th>Dự án</th><th>Mã YC/HD</th><th>Mã sản phẩm</th><th>Mã đề nghị</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày cập nhật</th></tr></thead>
      <tbody><tr><td style="white-space:nowrap">${r.duAn}</td><td>${r.ycHd||''}</td><td>${r.sp||''}</td><td class="code">${ma}</td><td>${r.soTien}</td><td style="white-space:nowrap">${ptLabel(r.status)}</td><td style="white-space:nowrap">${ngayCN}</td></tr></tbody></table>
     </div>
     <div style="display:flex;gap:40px;background:#eef4ff;border-top:1px solid #d8e6fb;padding:14px 18px;font-size:13px;flex-wrap:wrap">
       <span><b>Số tiền:</b> ${r.soTien}</span><span><b>Đã thanh toán:</b> ${r.status==='da_duyet'?r.soTien:'0'}</span><span><b>Còn lại:</b> ${r.status==='da_duyet'?'0':r.soTien}</span></div>
   </div>
   <div class="card" style="margin-top:18px">
     <div class="section-title">Thông tin chi tiết</div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 48px">
       <div>${kv('Mã đề nghị:',ma)}${kv('Họ và tên:',r.kh)}${kv('Số tiền:',r.soTien+' VND')}${kv('Hình thức thanh toán:','Đã thu ĐVBH')}${kv('Ngày tạo đề nghị thu tiền:',r.ngayTao)}${showFee?kv('Phí giao dịch:','0 VND'):''}</div>
       <div>${kv('Sàn:',r.san)}${kv('Loại phiếu thu:',r.loaiPhieu)}${kv('Mã chứng từ:',r.chungTu||'')}${kv('Mã YC/HD:',r.ycHd||'')}${kv('Mã sản phẩm:',r.sp||'')}${kv('Lý do thanh toán:','Thu tiền khách hàng '+r.kh+' Căn '+(r.sp||''))}</div>
     </div>
   </div>`;
}
/* lọc đề nghị thu tiền theo điều kiện filterBar */
function applyReqFilter(list, f){
  f=f||{};
  return list.filter(r=>{
    if(!Filt.any(f.q, r.ma, r.kh, r.sp, r.san, r.duAn, r.ycHd, r.chungTu)) return false;
    if(f.loai && f.loai!=='Tất cả' && r.loaiPhieu!==f.loai) return false;
    if(f.tt   && f.tt!=='Tất cả'   && ptLabel(r.status)!==f.tt) return false;
    if(f.duan && f.duan!=='Tất cả' && r.duAn!==f.duan) return false;
    if(f.erp  && f.erp!=='Tất cả'){ const synced=!!r.chungTu; if(f.erp==='Đã đồng bộ'&&!synced) return false; if(f.erp==='Chưa đồng bộ'&&synced) return false; }
    if(!Filt.inRange(r.ngayTao, f.from, f.to)) return false;
    return true;
  });
}
function reqListResults(){ const list=applyReqFilter(Store.get().payReqs.filter(r=>Perm.inScope(r.san)), Filt.st('reqlist')); return reqTable(list,false,false)+pagerN('Hiển thị '+list.length+' bản ghi',1); }
SCREENS["req-list"]=()=>{ Filt.reg('reqlist',reqListResults); return `${filterBar({key:'reqlist',denghi:true,trangthai:true,duan:true,erp:true})}<div id="reqlist-res">${reqListResults()}</div>`; };
SCREENS["req-detail"]=()=>reqDetail(curReq,curReqFee);

SCREENS["req-create"]=()=>`
  <div class="save-row" style="align-items:center">
    <div class="page-title" style="margin:0;flex:1;text-transform:none;font-size:18px;color:var(--ink)">Tạo đề nghị thu tiền</div>
    <button class="btn btn-primary" onclick="go('req-list')">↩ Quay lại</button></div>
  <div class="grid2">
    <div class="card">
      <div class="section-title">Thông tin đề nghị thu tiền</div>
      <div class="frow"><label>Loại đề nghị</label><div style="display:flex;justify-content:space-between;max-width:520px">${radioInline('lreq',[['hd','Hợp đồng dịch vụ'],['ycdch','YCDCH'],['ycdc','YCDC']],'ycdch')}</div></div>
      ${frow('Mã đề nghị',0,inp(''))}${frow('Mã YCDHC/YCDC',1,searchSel(''))}
      ${naRow('Dự án')}${naRow('Mã sản phẩm')}${naRow('Khách hàng')}${naGeo('Địa chỉ')}
      <div class="frow top"><label>Phương thức giao dịch <span class="req">*</span></label><div>
        <label class="chk" style="margin:0 0 10px"><input type="radio" name="ptgd" checked> Chuyển khoản</label>
        <div class="two" style="margin-bottom:8px">${sel(['Chọn ngân hàng','Vietcombank','BIDV','Techcombank'])}${inp('','Nhập số tài khoản')}</div>
        <textarea class="inp" placeholder="Nhập nội dung chuyển khoản"></textarea></div></div>
    </div>
    <div class="card" style="align-self:start">
      <div class="section-title">Thông tin chi phí</div>
      ${moneyRow('Số tiền',1)}${frow('Lý do thanh toán',1,`<textarea class="inp" placeholder="Lý do thanh toán"></textarea>`)}
      ${frow('Ngày nộp tiền',1,datein('25/06/2026'))}
      <div style="font-weight:600;margin:14px 0 8px">Nhập ảnh hoặc chứng từ liên quan</div>
      ${bigUpload('Tải nhập tài liệu','Tải tối đa 5 files, mỗi file ≤ 10MB · Tổng ≤ 25MB')}
    </div>
  </div>
  <div style="display:flex;justify-content:center;gap:14px;margin-top:18px">
    <button class="btn" style="background:var(--orange);color:#fff;padding:10px 28px" onclick="toast('Đã lưu đề nghị thu tiền')">Lưu</button>
    <button class="btn btn-primary" style="padding:10px 28px" onclick="go('req-list')">Đóng</button>
  </div>`;

/* ===== HOÀN TIỀN (3 cấp: Đại lý tạo → KD duyệt → KT hoàn) ===== */
function refundLabel(k){ return CFG.REFUND_ST[k]||k; }
function refundPill(k){ const map={cho_kd:'#FFF3D6;color:#a9820a',cho_kt:'#E6F0FF;color:#1565d8',da_hoan:'#D6F0DD;color:#1f8a44',tu_choi:'#FBDADA;color:#c0392b'};
  return `<span style="background:${map[k]||'#eef0f3;color:#555'};padding:3px 9px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap">${refundLabel(k)}</span>`; }
function refundActions(r){
  const a=[];
  if(r.status==='cho_kd' && Perm.can('refund.approve.kd')){ a.push(`<a href="#" onclick="refundKD('${r.id}');return false">Duyệt</a>`); a.push(`<a href="#" style="color:var(--red)" onclick="refundReject('${r.id}');return false">Từ chối</a>`); }
  if(r.status==='cho_kt' && Perm.can('refund.approve.kt')) a.push(`<a href="#" onclick="refundKT('${r.id}');return false">✔ Xác nhận hoàn tiền</a>`);
  return a.join(' &nbsp; ')||'<span style="color:#9aa3af">—</span>';
}
function refundResults(scope){
  const f=Filt.st(scope==='kt'?'accrefund':'refundlist');
  let list=(Store.get().refunds||[]).filter(r=>Perm.inScope(r.dvbh));
  if(scope==='kt') list=list.filter(r=>r.status==='cho_kt');
  list=list.filter(r=>{ if(!Filt.any(f.q, r.id, r.productMa, r.kh, r.dvbh, r.lyDo)) return false;
    if(f.tt && f.tt!=='Tất cả' && refundLabel(r.status)!==f.tt) return false; return true; });
  if(!list.length) return emptyState('Không có đề nghị hoàn tiền');
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th>STT</th><th>Mã đề nghị</th><th>Mã SP</th><th>Khách hàng</th><th>ĐVBH</th><th>Số tiền</th><th>Lý do</th><th>Ngày tạo</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
    <tbody>${list.map((r,i)=>`<tr><td>${i+1}</td><td class="code">${r.id}</td><td>${r.productMa?`<span class="code" onclick="openProduct('${r.productMa}')">${r.productMa}</span>`:''}</td><td>${r.kh}</td><td>${r.dvbh}</td><td>${r.soTien}</td><td>${r.lyDo}</td><td style="white-space:nowrap">${r.ngayTao}</td><td>${refundPill(r.status)}</td><td style="white-space:nowrap">${refundActions(r)}</td></tr>`).join('')}</tbody></table></div>
    ${pagerN('Hiển thị '+list.length+' bản ghi',1)}`;
}
function refundKD(id){ const r=Workflow.approveRefundKD(id); toast(r.msg,r.ok?'':'err'); if(r.ok) App.rerender(); }
function refundKT(id){ const r=Workflow.approveRefundKT(id); toast(r.msg,r.ok?'':'err'); if(r.ok) App.rerender(); }
function refundReject(id){ const r=Workflow.rejectRefund(id); toast(r.msg,r.ok?'':'err'); if(r.ok) App.rerender(); }
function openRefundPicker(){
  const units=Store.products().filter(p=>p.khName && Perm.inScope(p.dvbh) && ['giu_cho','dang_ky','kiem_tra','cho_duyet','da_coc','hop_dong'].indexOf(p.status)>=0);
  if(!units.length){ toast('Không có căn đang giao dịch để hoàn tiền','warn'); return; }
  document.getElementById('modalRoot').innerHTML=`
  <div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="width:560px">
    <div class="modal-h"><b>Tạo đề nghị hoàn tiền</b><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="note-bar">Sau khi tạo: <b>KD duyệt</b> → <b>Kế toán chuyển tiền &amp; xác nhận</b> → căn được thu hồi.</div>
      ${frow('Chọn căn',1,selId('rfUnit', units.map(p=>p.ma+' — '+p.khName)))}
      ${frow('Số tiền hoàn',1,inpId('rfAmount2','100.000.000'))}
      ${frow('Lý do',1,`<textarea id="rfReason2" class="inp">Khách yêu cầu hủy</textarea>`)}
      <div class="modal-actions" style="justify-content:flex-end"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button><button class="btn btn-primary" onclick="submitRefundPicker()">Tạo đề nghị</button></div>
    </div></div></div>`;
}
function submitRefundPicker(){
  const ma=((document.getElementById('rfUnit')||{}).value||'').split(' — ')[0];
  const v=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  runWF('refund', ma, {soTien:v('rfAmount2'), lyDo:v('rfReason2')});
}
SCREENS["refund-list"]=()=>{ Filt.reg('refundlist',()=>refundResults('all')); return `
  ${filterBar({key:'refundlist',trangthai:true,right:rightBtns(`${Perm.can('refund.create')?`<button class="btn btn-ghost" onclick="openRefundPicker()">＋ Tạo đề nghị hoàn tiền</button>`:''}<button class="btn btn-primary" onclick="toast('Đang tải về...')">Tải về</button>`)})}
  <div id="refundlist-res">${refundResults('all')}</div>`; };

/* ===== KẾ TOÁN ===== */
function reqPendingResults(){
  const list=applyReqFilter(Store.get().payReqs.filter(r=>r.status==='cho_duyet'), Filt.st('reqpend'));
  return list.length?reqTable(list,false,true)+pagerN('Hiển thị '+list.length+' bản ghi',1):emptyState('Không có đề nghị chờ duyệt');
}
SCREENS["req-pending"]=()=>{ Filt.reg('reqpend',reqPendingResults); return `${filterBar({key:'reqpend',denghi:true,duan:true,erp:true,right:rightBtns(`<button class="btn btn-primary" onclick="toast('Duyệt bảng kê')">Duyệt Bảng Kê</button>`)})}<div id="reqpend-res">${reqPendingResults()}</div>`; };
function reqDoneResults(){
  const list=applyReqFilter(Store.get().payReqs.filter(r=>r.status==='da_duyet'), Filt.st('reqdone'));
  return reqTable(list,true,false)+pagerN('Hiển thị '+list.length+' bản ghi',1);
}
SCREENS["req-done"]=()=>{ Filt.reg('reqdone',reqDoneResults); return `${filterBar({key:'reqdone',denghi:true,duan:true,erp:true})}<div id="reqdone-res">${reqDoneResults()}</div>`; };
SCREENS["transfer-wait"]=()=>`
  <div class="page-title">Chuyển khoản chờ xác nhận</div>
  <div style="display:flex;gap:26px;align-items:flex-end;flex-wrap:wrap;margin-bottom:8px">
    ${fField('Chọn dự án',`<input class="inp" placeholder="Nhập tên dự án" style="min-width:210px">`)}
    ${fField('Tìm kiếm',`<input class="inp" placeholder="Nhập từ khóa" style="min-width:230px">`)}
    ${fField('Ngân hàng',`<div style="min-width:300px">${sel(['Chọn ngân hàng','Vietcombank','BIDV','Techcombank','ACB','MB Bank'])}</div>`)}
    <div style="flex:1"></div><button class="btn btn-primary" onclick="toast('Đang tải về...')">Tải về danh sách</button></div>
  <div style="overflow:auto"><table class="tbl"><thead><tr>
    <th>STT</th><th>Mã sản phẩm</th><th>Giá sản phẩm</th><th>Khách hàng</th><th>Email</th><th>Số điện thoại</th><th>Đơn vị bán hàng</th><th>Tư vấn viên</th><th>Ngân hàng</th><th>Trạng thái</th></tr></thead>
    <tbody><tr><td colspan="10" style="text-align:center;color:#7b8694;padding:60px 0">Không có giao dịch</td></tr></tbody></table></div>`;

let receiptType='hopdong';
function setReceiptType(t){ receiptType=t; App.renderContent(); }
SCREENS.receipt=()=>{
  const khac = receiptType==='khac';
  const midInfo = khac ? `
      ${frow('Khách hàng',1,inp('','Nhập tên khách hàng'))}
      <div class="frow top"><label>Địa chỉ</label><div style="border:1px solid var(--line);border-radius:8px;padding:14px">
        <div class="two" style="margin-bottom:8px">${sel(['Việt Nam'])}${sel(['Chọn Tỉnh/ TP'])}</div>
        ${inp('','Địa chỉ/ số nhà...')}</div></div>`
    : `${frow('Mã đề nghị',0,inp(''))}${frow('Dự án',1,sel(['','Đà Nẵng Times Square','Dự án đào tạo Đợt 1']))}${frow('Hợp đồng',1,searchSel(''))}${naRow('Mã sản phẩm')}${naRow('Khách hàng')}`;
  const costExtra = khac ? '' : frow('Đợt thanh toán',1,searchSel(''));
  return `
  <div class="save-row" style="align-items:center">
    <div class="page-title" style="margin:0;flex:1">TẠO PHIẾU THU</div>
    <span class="badge-status" style="background:#E2F6E6;color:#1f9d3d">Trạng thái HĐ: Tạo mới</span>
    <button class="btn btn-blue" onclick="toast('Đã lưu phiếu thu')">🖫 Lưu</button>
    <button class="btn btn-ghost" onclick="go('req-list')">↩ Quay lại</button></div>
  <div class="grid2">
    <div class="card">
      <div class="section-title">Thông tin thu tiền</div>
      <div class="frow"><label>Loại đề nghị <span class="req">*</span></label><div style="display:flex;justify-content:space-between;max-width:480px">${radioInline('lpt',[['hopdong','Hợp đồng'],['nolai','Nợ lãi'],['khac','Khác']],receiptType,'setReceiptType')}</div></div>
      ${midInfo}
      <div class="frow top"><label>Phương thức giao dịch <span class="req">*</span></label><div>
        <div class="two" style="margin-bottom:6px"><label class="chk" style="margin:0"><input type="radio" name="ptgd2" checked> Chuyển khoản</label><label class="chk" style="margin:0"><input type="radio" name="ptgd2"> Tiền mặt</label></div>
        <textarea class="inp" placeholder="Nhập nội dung chuyển khoản"></textarea></div></div>
    </div>
    <div class="card" style="align-self:start">
      <div class="section-title">Thông tin chi phí</div>
      ${costExtra}${moneyRow('Số tiền',1)}${frow('Lý do thanh toán',1,`<textarea class="inp" placeholder="Lý do thanh toán"></textarea>`)}
      ${frow('Ngày nộp tiền',1,datein('25/06/2026'))}
      ${bigUpload('Upload tài liệu','Tải tối đa 5 files, mỗi file ≤ 10MB · Tổng ≤ 25MB')}
    </div>
  </div>`;
};
let chiType='ycdch';
function setChiType(t){ chiType=t; App.renderContent(); }
SCREENS["voucher-chi"]=()=>`
  <div class="save-row" style="align-items:center">
    <div class="page-title" style="margin:0;flex:1">TẠO PHIẾU CHI</div>
    <span class="badge-status" style="background:#E2F6E6;color:#1f9d3d">Trạng thái HĐ: Tạo mới</span>
    <button class="btn btn-blue" onclick="toast('Đã lưu phiếu chi')">🖫 Lưu</button>
    <button class="btn btn-ghost" onclick="go('req-list')">↩ Quay lại</button></div>
  <div class="grid2">
    <div class="card">
      <div class="section-title">Thông tin chi tiền</div>
      <div class="frow"><label>Loại đề nghị <span class="req">*</span></label><div style="display:flex;gap:60px">${radioInline('lchi',[['ycdch','YCDCH'],['thanhly','Thanh lý hợp đồng']],chiType,'setChiType')}</div></div>
      ${frow('Mã phiếu chi',0,inp(''))}${frow('Dự án',1,searchSel(''))}
      ${frow(chiType==='thanhly'?'Hợp đồng thanh lý':'YCDCH',1,searchSel(''))}${naRow('Mã sản phẩm')}${naRow('Khách hàng')}
      <div class="frow top"><label>Phương thức giao dịch <span class="req">*</span></label><div><textarea class="inp" placeholder="Nhập nội dung chuyển khoản"></textarea></div></div>
    </div>
    <div class="card" style="align-self:start">
      <div class="section-title">Thông tin chi phí</div>
      ${moneyRow('Số tiền',1)}${frow('Lý do thanh toán',1,`<textarea class="inp" placeholder="Lý do thanh toán"></textarea>`)}${frow('Ngày nộp tiền',1,datein('25/06/2026'))}
      ${bigUpload('Upload tài liệu','Tải tối đa 5 files, mỗi file ≤ 10MB · Tổng ≤ 25MB')}
    </div>
  </div>`;
SCREENS["acc-refund"]=()=>{ Filt.reg('accrefund',()=>refundResults('kt')); return `
  ${filterBar({key:'accrefund',trangthai:true,right:rightBtns(`<button class="btn btn-primary" onclick="toast('Duyệt bảng kê hoàn tiền')">Duyệt Bảng Kê</button>`)})}
  <div id="accrefund-res">${refundResults('kt')}</div>`; };
