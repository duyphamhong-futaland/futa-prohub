/* ============================================================
   FUTA Land — Prohub  ·  screens-policy.js
   Chính sách thanh toán / chiết khấu (workflow duyệt), CTBH, tạo dự án,
   đơn thanh lý. Danh sách đọc từ Store; duyệt/ từ chối ghi qua Store.
   ============================================================ */
window.SCREENS = window.SCREENS || {};

/* ---- workflow chính sách ---- */
function polFind(ma){ const st=Store.get(); return st.polTT.find(p=>p.ma===ma)||st.polCK.find(p=>p.ma===ma); }
function polSubmit(ma){ Store.mutate(()=>{ const p=polFind(ma); if(p&&p.status==='khoi_tao') p.status='cho_duyet'; Store.notify('Trình duyệt '+ma); Store.audit('Trình duyệt chính sách '+ma, ma); }); toast('Đã trình duyệt '+ma); }
function polApprove(ma){ if(!Perm.guard('policy.approve'))return; Store.mutate(()=>{ const p=polFind(ma); if(p) p.status='duyet'; Store.notify('Duyệt chính sách '+ma,'Khác','Chính sách'); Store.audit('Duyệt chính sách '+ma, ma); }); toast('Đã duyệt '+ma); }
function polReject(ma){ if(!Perm.guard('policy.approve'))return; Store.mutate(()=>{ const p=polFind(ma); if(p){p.status='tu_choi'; p.lyDo='Không đạt điều kiện';} Store.audit('Từ chối chính sách '+ma, ma); }); toast('Đã từ chối '+ma,'warn'); }
function polDelete(ma,loai){ Store.mutate(st=>{ const arr=loai==='ck'?st.polCK:st.polTT; const i=arr.findIndex(p=>p.ma===ma); if(i>=0&&arr[i].status==='khoi_tao') arr.splice(i,1); }); toast('Đã xoá '+ma,'warn'); }

function polStatusCell(status){
  if(status==='khoi_tao') return '<span class="badge-status bg-init">Khởi tạo</span>';
  if(status==='cho_duyet') return '<span class="badge-status bg-wait">Chờ duyệt</span>';
  if(status==='duyet') return '<span class="tag-ok">Đã duyệt</span>';
  if(status==='tu_choi') return '<span style="color:#c0392b;font-weight:600">Từ chối</span>';
  return status;
}
function polActions(p, loai){
  const a=[];
  if(p.status==='khoi_tao'){ if(Perm.can('policy.create')) a.push(`<a href="#" onclick="polSubmit('${p.ma}');return false">Trình duyệt</a>`);
    if(Perm.can('policy.create')) a.push(`<span style="color:#c0392b;cursor:pointer" onclick="polDelete('${p.ma}','${loai}')">🗑</span>`); }
  if(p.status==='cho_duyet'&&Perm.can('policy.approve')){ a.push(`<a href="#" onclick="polApprove('${p.ma}');return false">Duyệt</a>`); a.push(`<a href="#" style="color:var(--red)" onclick="polReject('${p.ma}');return false">Từ chối</a>`); }
  return a.join(' &nbsp; ');
}
function policyTable(rows,loai,detailRoute){
  return `<table class="tbl"><thead><tr>
    <th>STT</th><th>Mã chính sách <span class="sort">⇅</span></th><th>Tên chính sách</th>
    <th>Dự án <span class="sort">⇅</span></th><th>Thời gian áp dụng <span class="sort">⇅</span></th>
    <th>Trạng thái <span class="sort">⇅</span></th><th>Lý do từ chối</th><th>Hành động</th></tr></thead>
    <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td class="code" onclick="go('${detailRoute}')">${r.ma}</td><td>${r.ten}</td><td>${r.duAn}</td>
      <td>${r.thoiGian}</td><td>${polStatusCell(r.status)}</td><td style="color:#c0392b">${r.lyDo||''}</td><td style="white-space:nowrap">${polActions(r,loai)}</td></tr>`).join('')}</tbody></table>`;
}
function polFilter(rows,f){ f=f||{}; return rows.filter(r=>{
  if(!Filt.any(f.q, r.ma, r.ten, r.duAn)) return false;
  if(f.tt && f.tt!=='Tất cả' && polStatusText(r.status)!==f.tt) return false;
  return true; }); }
function polStatusText(s){ return {khoi_tao:'Khởi tạo',cho_duyet:'Chờ duyệt',duyet:'Đã duyệt',tu_choi:'Từ chối'}[s]||s; }
function payListResults(){ const rows=polFilter(Store.get().polTT, Filt.st('paylist')); return policyTable(rows,'tt','pay-detail')+pagerN('Hiển thị '+rows.length+' bản ghi',1); }
SCREENS["pay-list"]=()=>{ Filt.reg('paylist',payListResults); return `
  <div class="toolbar"><div class="page-title" style="margin:0">CHÍNH SÁCH THANH TOÁN</div><div class="spacer"></div>
    ${Filt.searchBox('paylist',230)}
    ${Filt.sel('paylist','tt',['Tất cả','Khởi tạo','Chờ duyệt','Đã duyệt','Từ chối'])}
    ${Perm.can('policy.create')?`<button class="btn btn-primary" onclick="go('pay-form')">Tạo mới chính sách</button>`:''}</div>
  <div id="paylist-res">${payListResults()}</div>`; };

function discListResults(){ const rows=polFilter(Store.get().polCK, Filt.st('disclist')); return policyTable(rows,'ck','disc-detail')+pagerN('Hiển thị '+rows.length+' bản ghi',1); }
SCREENS["disc-list"]=()=>{ Filt.reg('disclist',discListResults); return `
  <div class="toolbar"><div class="page-title" style="margin:0">CHÍNH SÁCH CHIẾT KHẤU</div><div class="spacer"></div>
    ${Filt.searchBox('disclist',230)}
    ${Filt.sel('disclist','tt',['Tất cả','Khởi tạo','Chờ duyệt','Đã duyệt','Từ chối'])}
    ${Perm.can('policy.create')?`<button class="btn btn-primary" onclick="go('disc-form')">Tạo mới chính sách chiết khấu</button>`:''}</div>
  <div id="disclist-res">${discListResults()}</div>`; };

/* ---- form chính sách thanh toán (lưu tạo record khoi_tao) ---- */
function instRow(no,name,val,unit,days,milestone,radio){
  return `<tr>
   <td>${inp(no)}</td><td>${inp('','Tên đợt (tiền)')}</td><td>${inp(val)}</td>
   <td>${sel(unit==='VND'?['VND','%']:['%','VND'])}</td><td>${sel(['Nhà/Đất','Nhà','Đất'])}</td>
   <td>${inp(days)}</td><td>${sel(['Số ngày','Theo sự kiện'])}</td>
   <td>${sel([milestone,'Ký đơn đăng ký','Thanh toán lần 1','Thanh toán lần 2','Thông báo bàn giao','Cấp GCN'])}</td>
   <td>${inp('','Mô tả (tiếng Anh)')}</td>
   <td style="text-align:center"><input type="radio" name="hdmb" ${radio?'checked':''}> Ra HĐMB</td>
   <td style="text-align:center"><span style="color:#b0b6c0;cursor:pointer">⊗</span></td></tr>`;
}
SCREENS["pay-form"]=()=>`
  <div class="save-row"><span class="badge-status bg-init">Trạng thái: Khởi tạo</span>
    <button class="btn btn-blue" onclick="savePolicy('tt')">🖫 Lưu</button><button class="btn btn-ghost" onclick="go('pay-list')">↩ Quay lại</button></div>
  <div class="card" style="margin-bottom:18px">
    <div class="section-title">Thông tin chung</div>
    <div class="grid2">
      <div>
        ${frow('Mã chính sách',0,inp(undefined,'','dis'))}
        ${frow('Tên chính sách',1,inpId('polName','CS PTTT chuẩn'))}
        ${frow('Tên chính sách (tiếng Anh)',0,inp('','Nhập tên chính sách tiếng Anh'))}
        ${frow('Dự án áp dụng',1,selId('polProj',['Dự án đào tạo Đợt 1','Đà Nẵng Times Square','Futaland Demo']))}
        ${frow('Kích hoạt',0,`<div class="tg on" onclick="this.classList.toggle('on')"></div>`)}
      </div>
      <div>
        ${frow('Ngày áp dụng',1,datein())}${frow('Ngày hết hạn',1,datein())}
        ${frow('Ngày ký kết',0,datein())}${frow('Loại',1,sel(['Mặc định','Vay ngân hàng']))}
      </div>
    </div>
  </div>
  <div class="card">
    <div class="section-title" style="color:#5b2bd6">Đợt thanh toán</div>
    ${frow('Số đợt thanh toán',1,inp('9'))}
    <div style="overflow:auto;margin-top:8px">
      <table class="tbl" style="box-shadow:none">
        <thead><tr><th>Đợt</th><th>Tên đợt</th><th>Giá trị</th><th>Đơn vị</th><th>Cơ sở</th><th>Số ngày</th><th>Loại</th><th>Mốc tiến độ</th><th>Mô tả (EN)</th><th>Ra HĐMB</th><th></th></tr></thead>
        <tbody>
          ${instRow('Đăng ký NV','','100,000','VND','0','Ký đơn đăng ký',false)}
          ${instRow('1','','30','%','7','Thanh toán lần 1',true)}
          ${instRow('2','','40','%','45','Thanh toán lần 2',false)}
          ${instRow('3','','25','%','45','Thông báo bàn giao',false)}
          ${instRow('4','','5','%','45','Cấp GCN',false)}
        </tbody></table></div>
    <div style="margin-top:12px"><button class="btn btn-ghost">⊕ Thêm đợt</button></div>
  </div>`;

SCREENS["disc-form"]=()=>`
  <div class="save-row"><span class="badge-status bg-init">Trạng thái: Khởi tạo</span>
    <button class="btn btn-blue" onclick="savePolicy('ck')">🖫 Lưu</button><button class="btn btn-ghost" onclick="go('disc-list')">↩ Quay lại</button></div>
  <div class="grid2">
    <div class="card">
      <div class="section-title">Thông tin chung</div>
      ${frow('Mã chính sách',0,inp(undefined,'','dis'))}
      ${frow('Tên chính sách',1,inpId('polName','CSCK Early Bird Demo'))}
      ${frow('Tên chính sách (tiếng Anh)',0,inp('','Nhập tên chính sách tiếng Anh'))}
      ${frow('Dự án áp dụng',1,selId('polProj',['Futaland Demo','Đà Nẵng Times Square','Dự án đào tạo Đợt 1']))}
      <div class="frow"><label>Ngày áp dụng <span class="req">*</span></label><div class="two">${datein()}${datein()}</div></div>
      ${frow('Số sản phẩm áp dụng',0,inp('10,000'))}${frow('Ngày ký kết',0,datein())}
      ${frow('Kích hoạt',0,`<div class="tg on" onclick="this.classList.toggle('on')"></div>`)}
      ${frow('Loại',1,sel(['Mặc định','Theo điều kiện']))}
      ${frow('Loại chiết khấu',0,sel(['Phần trăm','Số tiền']))}
      ${frow('Chiết khấu',0,`<div class="with-btn">${inp('')}<button class="btn btn-ghost btn-sm">%</button></div>`)}
      ${frow('Mô tả chiết khấu',0,`<textarea class="inp" placeholder="Nhập mô tả chiết khấu"></textarea>`)}
      ${chk('Quản lý voucher khách hàng')}
    </div>
    <div class="card">
      <div class="section-title">Tài liệu liên quan</div>
      <label style="font-size:12.5px;color:#3a4658">Tài liệu đính kèm</label>
      ${bigUpload('Upload tài liệu','Tải tối đa 10 files, mỗi file ≤ 10MB · Tổng ≤ 25MB')}
      <label style="font-size:12.5px;color:#3a4658">Ghi chú</label>
      <textarea class="inp" placeholder="Nhập nội dung ghi chú" style="margin:6px 0 16px"></textarea>
    </div>
  </div>`;
function savePolicy(loai){
  if(!Perm.guard('policy.create'))return;
  const name=(document.getElementById('polName')||{}).value||'Chính sách mới';
  const proj=(document.getElementById('polProj')||{}).value||'Dự án đào tạo Đợt 1';
  const prefix=loai==='ck'?'CSCK-':'CSTT-';
  const ma=Store.nextCode(loai==='ck'?'csck':'cstt',prefix,5);
  Store.mutate(st=>{ (loai==='ck'?st.polCK:st.polTT).unshift({ma,ten:name,duAn:proj,thoiGian:'25/06/2026 - 25/06/2040',status:'khoi_tao',loai}); Store.notify('Tạo chính sách '+ma); });
  toast('Đã lưu chính sách '+ma); go(loai==='ck'?'disc-list':'pay-list');
}

/* ---- chi tiết chính sách (xem) ---- */
SCREENS["pay-detail"]=()=>{
  const p=Store.get().polTT[0]||{ma:'CSTT-00042',ten:'PTTT VAY NH CT7 (ĐỢT 2)',duAn:'Đà Nẵng Times Square',status:'duyet'};
  return `<div class="save-row" style="align-items:center">
    <div class="page-title" style="margin:0;flex:1">THÔNG TIN CHÍNH SÁCH</div>
    ${polStatusCell(p.status)}
    ${p.status==='cho_duyet'&&Perm.can('policy.approve')?`<button class="btn btn-primary" onclick="polApprove('${p.ma}');go('pay-list')">Duyệt</button>`:''}
    <button class="btn btn-ghost" onclick="toast('Mở chỉnh sửa chính sách')">✎ Chỉnh sửa</button>
    <button class="btn btn-ghost" onclick="go('pay-list')">↩ Quay lại</button></div>
  <div class="grid2 det">
    <div class="card">
      <div class="section-title">Thông tin chung</div>
      ${frow('Mã chính sách',0,disInp(p.ma))}${frow('Tên chính sách',1,disInp(p.ten))}
      ${frow('Dự án áp dụng',1,selDis(p.duAn))}${frow('Chương trình bán hàng',0,selDis('Mở bán CT7'))}
      ${frow('Thời gian áp dụng',0,disInp(p.thoiGian||''))}
      ${frow('Số sản phẩm áp dụng',0,disInp('1,000'))}${frow('Kích hoạt',0,`<div class="tg on" style="opacity:.7"></div>`)}
      <label style="font-size:12.5px;color:#3a4658;display:block;margin:10px 0 0">Mẫu in hợp đồng</label>
      ${fileList(['HĐMB CĂN HỘ CT7 - HTLS ĐỢT 2 - CÁ NHÂN.docx','PL 01-B DIEU CHINH TIEN DO THANH TOAN CT7 - CÔNG TY.docx'])}
    </div>
    <div class="card">
      <div class="section-title">Tài liệu liên quan</div>
      ${bigUpload('Upload tài liệu','Tải tối đa 10 files, mỗi file ≤ 10MB · Tổng ≤ 25MB')}
      <div class="chk" style="margin:18px 0 14px"><input type="checkbox" checked disabled><span style="font-weight:600">Có lãi trễ hạn thanh toán</span></div>
      ${frow('Loại lãi theo ngày',1,selDis('%'))}${frow('Giá trị',1,disInp('0.03'))}${frow('Số ngày tính lãi',1,disInp('0'))}
    </div>
  </div>`;
};
SCREENS["disc-detail"]=()=>{
  const p=Store.get().polCK[0]||{ma:'CSCK-00012',ten:'CSCK Early Bird Demo',duAn:'Futaland Demo',status:'khoi_tao'};
  return `<div class="save-row" style="align-items:center">
    <div class="page-title" style="margin:0;flex:1">THÔNG TIN CHÍNH SÁCH</div>
    ${polStatusCell(p.status)}
    ${p.status==='cho_duyet'&&Perm.can('policy.approve')?`<button class="btn btn-primary" onclick="polApprove('${p.ma}');go('disc-list')">Duyệt</button>`:''}
    <button class="btn btn-ghost" onclick="toast('Mở chỉnh sửa chính sách')">✎ Chỉnh sửa</button>
    <button class="btn btn-ghost" onclick="go('disc-list')">↩ Quay lại</button></div>
  <div class="grid2 det">
    <div class="card">
      <div class="section-title">Thông tin chung</div>
      ${frow('Mã chính sách',0,disInp(p.ma))}${frow('Tên chính sách',1,disInp(p.ten))}
      ${frow('Dự án áp dụng',1,selDis(p.duAn))}${frow('Thời gian áp dụng',0,disInp(p.thoiGian||''))}
      ${frow('Loại chiết khấu',0,selDis('Phần trăm'))}${frow('Chiết khấu',0,disInp('1 %'))}
      ${frow('Mô tả chiết khấu',0,`<textarea class="inp dis" disabled>1% CK đặc biệt thay vì trả HH đại lý</textarea>`)}
    </div>
    <div class="card"><div class="section-title">Tài liệu liên quan</div>
      ${bigUpload('Upload tài liệu','Tải tối đa 10 files, mỗi file ≤ 10MB · Tổng ≤ 25MB')}</div>
  </div>`;
};

/* ---- CTBH list + form ---- */
function ctbhListResults(){
  const f=Filt.st('ctbhlist'); const all=Store.get().ctbhRows;
  const rows=all.filter(r=>{
    if(f.duan && f.duan!=='Tất cả dự án' && r.duAn!==f.duan) return false;
    if(!Filt.any(f.q, r.ten, r.ma, r.duAn)) return false;
    if(f.tt && f.tt!=='Tất cả' && (r.active?'Đang chạy':'Vô hiệu')!==f.tt) return false;
    return true;
  });
  return `<table class="tbl"><thead><tr><th>Dự án</th><th>Tên Chương trình</th><th>Mã chương trình</th><th>Trạng thái</th><th style="text-align:right">Hành động</th></tr></thead>
  <tbody>${rows.map(r=>{ const i=all.indexOf(r); return `<tr><td>${r.duAn}</td><td>${r.ten}</td><td>${r.ma}</td><td>${r.active?'<span class="tag-ok">Đang chạy</span>':'<span style="color:#9aa3af">Vô hiệu</span>'}</td>
    <td><div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-ghost btn-sm" onclick="go('ctbh')">Chi tiết</button>
      ${Perm.can('ctbh.manage')?(r.active
        ?`<button class="btn btn-sm" style="background:#fff;color:#d0392b;border:1px solid #d0392b" onclick="toggleCTBH(${i})">Vô hiệu</button>`
        :`<button class="btn btn-sm" style="background:#fff;color:#1f9d3d;border:1px solid #1f9d3d" onclick="toggleCTBH(${i})">Kích hoạt</button>`):''}
      <button class="btn btn-ghost btn-sm" onclick="toast('Quản lý hình ảnh CTBH')">Hình ảnh</button>
    </div></td></tr>`; }).join('')||`<tr><td colspan="5" style="text-align:center;color:#9aa3af;padding:30px">Không có CTBH phù hợp</td></tr>`}</tbody></table>
  ${pagerN('Hiển thị '+rows.length+' bản ghi',1)}`;
}
SCREENS["ctbh-list"]=()=>{ Filt.reg('ctbhlist',ctbhListResults);
  const duans=['Tất cả dự án'].concat([...new Set(Store.get().ctbhRows.map(r=>r.duAn))]);
  return `
  <div class="toolbar" style="margin-bottom:18px">
    ${Filt.sel('ctbhlist','duan',duans)}
    ${Filt.sel('ctbhlist','tt',['Tất cả','Đang chạy','Vô hiệu'])}
    ${Filt.searchBox('ctbhlist',260)}
  </div>
  <div id="ctbhlist-res">${ctbhListResults()}</div>`; };
function toggleCTBH(i){ Store.mutate(st=>{ st.ctbhRows[i].active=!st.ctbhRows[i].active; }); toast('Đã cập nhật trạng thái CTBH'); Filt.paint('ctbhlist'); }

const FLAGS=[
  ['Hiển Banner'],['Bán hàng mở rộng'],['Cho phép bổ sung HS sau',1],
  ['Cho phép ĐVBH xác nhận GD, bổ sung HS sau',1],
  ['Gộp Xác nhận và Xác nhận Bổ sung HS sau',0,'Tính năng này được mở khi tích "Cho phép ĐVBH xác nhận GD, bổ sung HS sau"'],
  ['Cho phép gửi HS KH khi bắt đầu ưu tiên'],['Cho phép gửi email khi xác nhận GD thành công'],
  ['CTBH không ráp Ưu Tiên'],['Gửi SMS cho KH và KH xác thực'],['Cho phép đặt chỗ chọn sản phẩm'],
  ['Cho phép ĐVBH nhìn thấy SP màu tím của ĐVBH khác'],['Cho phép popup khi ĐVBH xác nhận giao dịch'],
];
SCREENS.ctbh=()=>`
  <div class="save-row"><button class="btn btn-blue" onclick="toast('Đã lưu CTBH')">Lưu</button><button class="btn btn-ghost" onclick="go('ctbh-list')">↩ Quay lại</button></div>
  <div class="grid2">
    <div class="card">
      <div class="section-title">Thông tin bán hàng</div>
      ${frow('Dự án',1,sel(['Dự án đào tạo Đợt 1','Futaland Demo','Đà Nẵng Times Square']))}
      ${frow('Tên chương trình',1,inp('Futa CT007'))}${frow('Mã chương trình',1,inp('FTCT007'))}
      <div style="margin-top:6px">${FLAGS.map(f=>chk(f[0],f[1],f[2])).join('')}</div>
      ${frow('Thời gian mở bán',0,`<div class="two">${inp('','Chọn giờ')}${datein('DD/MM/YYYY')}</div>`)}
    </div>
    <div>
      <div class="card">
        <div class="section-title">Thông tin bảng hàng</div>
        ${chk('Vẽ BH Excel hoặc ImageMap')}
        <label style="font-size:12.5px;color:#3a4658;display:block;margin:6px 0 4px">Block/Khu dự án</label>
        <div class="with-btn" style="margin-bottom:6px">${inp('','Tên Block')}${inp('','Số tầng')}${inp('','Số sản phẩm/tầng')}<button class="btn btn-primary btn-sm">Thêm block</button></div>
        <div class="with-btn" style="margin-bottom:12px">${inp('CT7')}${inp('001..030')}${inp('001..012')}<button class="btn btn-ghost btn-sm">✕</button></div>
        ${frow('TG tự động trả về SP đăng ký (phút)',1,inp('10'))}
        ${frow('TG tự động trả về SP đã xác nhận (phút)',0,inp('0'))}
        ${frow('Chiết khấu (VND)',0,inp('0'))}
        ${frow('DANH SÁCH ĐƠN VỊ BÁN HÀNG',0,`<div class="with-btn">${sel(['Đơn vị','F1 - Đại lý A','F1 - Đại lý B'])}<button class="btn-outline-orange">Thêm</button></div>`)}
      </div>
      <div class="card" style="margin-top:18px">
        <div class="section-title">Phương thức thanh toán, chiết khấu</div>
        ${frow('Giá để tính',0,sel(['Giá chưa VAT','Giá có VAT']))}
        ${frow('Cách áp dụng chiết khấu',0,`<label class="chk" style="display:inline-flex;margin-right:18px"><input type="radio" name="ck"> Tuần tự</label><label class="chk" style="display:inline-flex"><input type="radio" name="ck" checked> Cộng dồn</label>`)}
        ${frow('Thuế VAT (%)',0,inp('10'))}
      </div>
    </div>
  </div>`;

/* ---- tạo mới dự án ---- */
SCREENS["project-form"]=()=>`
  <div class="save-row"><button class="btn btn-blue" onclick="saveProject()">🖫 Lưu dự án</button><button class="btn btn-ghost" onclick="go('projects')">↩ Quay lại</button></div>
  <div class="note-bar">Quy trình: <b>1.</b> Khởi tạo dự án → <b>2.</b> Thêm Đơn vị bán hàng → <b>3.</b> Thêm Chương trình bán hàng → <b>4.</b> Cấu hình email gửi đi.</div>
  <div class="grid2">
    <div class="card">
      <div class="section-title">Thông tin chung</div>
      ${frow('Tên dự án',1,inpId('pjName','','Nhập tên dự án'))}
      ${frow('Chủ đầu tư',1,selId('pjCdt',['Công ty CP BĐS FUTA Land','Phương Trang']))}
      ${frow('Loại hình',1,selId('pjLoai',['Căn hộ','Đất nền','Shophouse']))}
      ${frow('Mã dự án',0,inpId('pjCode','','VD: FUTA'))}
      <div class="frow"><label>Khu vực</label><div class="two">${sel(['Tỉnh/Thành','Đà Nẵng'])}${sel(['Quận/Huyện'])}</div></div>
      <div style="height:120px;border-radius:8px;background:linear-gradient(135deg,#a8c6e8,#cdd6ea);display:flex;align-items:center;justify-content:center;color:#fff;margin-top:6px">📍 Bản đồ vị trí dự án</div>
    </div>
    <div>
      <div class="card"><div class="section-title">2. Đơn vị bán hàng</div>
        <table class="tbl" style="box-shadow:none"><thead><tr><th>Mã ĐVBH</th><th>Tên ĐVBH</th><th>SLQ</th><th>Đồng bộ YC</th><th>Đồng bộ thu</th></tr></thead>
        <tbody><tr><td>${inp('F1')}</td><td>${inp('Đại lý A')}</td><td>${inp('50')}</td><td style="text-align:center"><input type="checkbox" checked></td><td style="text-align:center"><input type="checkbox" checked></td></tr></tbody></table>
        <div style="margin-top:10px"><button class="btn btn-ghost btn-sm">⊕ Thêm ĐVBH</button></div></div>
      <div class="card" style="margin-top:18px"><div class="section-title">3. Chương trình bán hàng</div>
        ${frow('Chọn CTBH',0,`<div class="with-btn">${sel(['Futa CT007','Mở bán'])}<button class="btn btn-primary btn-sm">Thêm</button></div>`)}</div>
      <div class="card" style="margin-top:18px"><div class="section-title">4. Cấu hình email gửi đi</div>
        ${frow('Mẫu email KH',0,sel(['Mẫu mặc định','Mẫu xác nhận cọc']))}
        ${frow('CC',0,inp('','email1@..., email2@...'))}</div>
    </div>
  </div>`;
function saveProject(){
  if(!Perm.guard('project.config'))return;
  const v=id=>(document.getElementById(id)||{}).value||'';
  const name=v('pjName'); if(!name){ toast('Nhập tên dự án','warn'); return; }
  Store.mutate(st=>{ const id='P'+(st.projects.length+1); st.projects.push({id,ten:name,code:v('pjCode')||'FUTA',loai:v('pjLoai')||'Căn hộ',chuDauTu:v('pjCdt')}); Store.notify('Tạo dự án '+name); });
  toast('Đã lưu dự án '+name); go('projects');
}

/* ---- đơn thanh lý / chuyển nhượng ---- */
function addr(){return `
  <div class="two" style="margin-bottom:6px">${sel(['Việt Nam'])}${sel(['Tỉnh/Thành','Bắc Giang','Đà Nẵng'])}</div>
  <div class="two" style="margin-bottom:6px">${sel(['Quận/Huyện','H. Lục Nam'])}${sel(['Phường/Xã','X. Bảo Đài'])}</div>
  ${inp('','Số nhà, đường...')}`;}
SCREENS["liq-form"]=()=>`
  <div class="save-row"><span class="badge-status bg-init">Trạng thái HĐ: Khởi tạo</span>
    <button class="btn btn-blue" onclick="toast('Đã lưu đơn đề nghị')">🖫 Lưu</button><button class="btn btn-ghost" onclick="go('projects')">↩ Quay lại</button></div>
  <div class="grid2">
    <div class="card">
      <div class="section-title">Thông tin chung</div>
      ${frow('Dự án',1,sel(['Dự án đào tạo Đợt 1','Futaland Demo']))}
      ${frow('Phiếu YCDCO',1,`<div class="with-btn">${inp('Test-YCDC-00245')}<button class="btn btn-ghost btn-sm">🔍</button></div>`)}
      ${frow('Tên đề nghị thanh lý',0,inp('LÊ HOÀNG CÔNG DANH'))}
      ${frow('Mã sản phẩm',0,inp('CT7-08.01','','dis'))}
      <div class="frow top"><label>Lý do</label><div>
        <label class="chk"><input type="radio" name="ly"> Hoàn tiền đặt cọc</label>
        <label class="chk"><input type="radio" name="ly"> Thanh lý không hoàn tiền</label>
        <label class="chk"><input type="radio" name="ly" checked> Đổi tên chuyển nhượng</label>
      </div></div>
      ${frow('Ngày tạo',0,datein('22/12/2025'))}${frow('Ghi chú',0,`<textarea class="inp"></textarea>`)}
    </div>
    <div class="card">
      <div class="section-title">Khách hàng chuyển nhượng</div>
      ${frow('Tên khách hàng',1,inp('KHÁCH HÀNG ABC'))}
      ${frow('Số điện thoại',1,inp('0987654321'))}${frow('Địa chỉ email',1,inp('danhlhc@gmail.com'))}
      ${frow('Số CMND/Hộ chiếu',1,inp('048565600000'))}
      <div class="frow top"><label>Địa chỉ thường trú</label><div>${addr()}</div></div>
    </div>
  </div>`;
