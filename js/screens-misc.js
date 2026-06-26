/* ============================================================
   FUTA Land — Prohub  ·  screens-misc.js
   Khách hàng · Phân quyền (RBAC) · TVV · Báo cáo · Chủ đầu tư ·
   Bàn giao · Lịch sử tải nhập.
   ============================================================ */
window.SCREENS = window.SCREENS || {};

/* ---- Khách hàng ---- */
function customersResults(){
  const f=Filt.st('cust'); const list=Store.get().customers.filter(c=>Filt.any(f.q, c.name, c.phone, c.cccd, c.email));
  return `<div style="overflow:auto"><table class="tbl"><thead><tr><th>STT</th><th>Họ tên</th><th>Giới tính</th><th>Ngày sinh</th><th>Điện thoại</th><th>Email</th><th>CCCD/Hộ chiếu</th><th>Sản phẩm quan tâm</th></tr></thead>
   <tbody>${list.map((c,i)=>{const linked=Store.products().filter(p=>p.customerId===c.id).map(p=>p.ma).join(', ');
     const sp=linked||c.spQuanTam||'';
     return `<tr><td>${i+1}</td><td style="white-space:nowrap;font-weight:600">${esc(c.name)}</td><td>${esc(c.gender||'')}</td><td>${esc(c.dob||'')}</td><td>${esc(c.phone||'')}</td><td>${esc(c.email||'')}</td><td>${esc(c.cccd||'')}</td><td>${esc(sp)||'—'}</td></tr>`;}).join('')||`<tr><td colspan="8" style="text-align:center;color:#9aa3af;padding:30px">Không có khách hàng phù hợp</td></tr>`}</tbody></table></div>
   ${pagerN('Hiển thị '+list.length+' bản ghi',1)}`;
}
SCREENS.customers=()=>{ Filt.reg('cust',customersResults); return `<div class="page-title">KHÁCH HÀNG</div>
   <div class="toolbar">${Filt.searchBox('cust',260)}<div class="spacer"></div>
     ${(typeof Perm==='undefined'||Perm.can('customers'))?`<button class="btn btn-primary" onclick="openCustomerForm()">＋ Tạo mới</button>`:''}</div>
   <div id="cust-res">${customersResults()}</div>`; };

/* Form tạo khách hàng (thu thập: Họ tên · Giới tính · Ngày sinh · Điện thoại ·
   Email · CCCD/Hộ chiếu · Sản phẩm quan tâm) */
function openCustomerForm(){
  if(typeof Perm!=='undefined' && !Perm.can('customers')){ toast('Bạn không có quyền tạo khách hàng','err'); return; }
  document.getElementById('modalRoot').innerHTML=`
  <div class="overlay" onclick="if(event.target===this)closeModal()">
   <div class="modal" style="max-width:560px">
    <div class="modal-h"><b>Tạo mới khách hàng</b><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b" style="max-height:80vh;overflow:auto">
      ${frow('Họ tên',1,inpId('cf_name','','Nguyễn Văn A'))}
      ${frow('Giới tính',0,selId('cf_gender',['Nam','Nữ','Khác']))}
      ${frow('Ngày sinh',0,inpId('cf_dob','','DD/MM/YYYY'))}
      ${frow('Điện thoại',0,inpId('cf_phone','','VD: 0905xxxxxx'))}
      ${frow('Email',0,inpId('cf_email','','vd@email.com'))}
      ${frow('CCCD/Hộ chiếu',0,inpId('cf_cccd','','Số CCCD/Hộ chiếu'))}
      ${frow('Sản phẩm quan tâm',0,inpId('cf_sp','','VD: CT7-09.04 · Căn 2PN · Shophouse'))}
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveCustomer()">Lưu khách hàng</button>
      </div>
    </div>
   </div>
  </div>`;
  setTimeout(()=>{const el=document.getElementById('cf_name'); if(el) el.focus();},30);
}
function saveCustomer(){
  if(typeof Perm!=='undefined' && !Perm.guard('customers')) return;
  const val=id=>{const e=document.getElementById(id); return e?e.value.trim():'';};
  const name=val('cf_name');
  if(!name){ toast('Vui lòng nhập họ tên khách hàng','warn'); const n=document.getElementById('cf_name'); if(n)n.focus(); return; }
  const phone=val('cf_phone'), email=val('cf_email'), cccd=val('cf_cccd');
  if(email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Email không hợp lệ','warn'); return; }
  if(phone && !/^[0-9+()\s.\-]{6,}$/.test(phone)){ toast('Số điện thoại không hợp lệ','warn'); return; }
  const dup=Store.get().customers.find(c=>(phone&&c.phone===phone)||(cccd&&c.cccd===cccd));
  if(dup && !confirm('Đã có khách "'+dup.name+'" trùng SĐT/CCCD. Vẫn tạo mới?')) return;
  const id='C'+Date.now().toString(36).toUpperCase();
  Store.mutate(st=>{
    st.customers.unshift({id, name, gender:val('cf_gender'), dob:val('cf_dob'), phone, email, cccd,
      ngayCap:'', noiCap:'', diaChi:'', spQuanTam:val('cf_sp')});
    Store.audit('Tạo khách hàng '+name, id);
  });
  toast('Đã tạo khách hàng: '+name);
  closeModal();
  if(typeof App!=='undefined' && App.rerender) App.rerender();
}

/* ---- RBAC ---- */
SCREENS.rbac=()=>{
  const caps=[['project.config','Cấu hình dự án / ĐVBH / email'],['ctbh.manage','CTBH · bảng hàng · giá'],
    ['price.publish','Công bố giá'],['policy.create','Tạo chính sách (TT/CK)'],['policy.approve','Duyệt chính sách'],
    ['booking','Booking / Hàng đợi / Chọn KH'],['contract.manage','Hợp đồng + xác nhận ký'],
    ['accounting.approve','Phiếu thu / duyệt thu'],['refund.create','Tạo phiếu hoàn/hủy'],
    ['refund.approve.kd','Duyệt hoàn/hủy (KD)'],['refund.approve.kt','Duyệt hoàn tiền (KT)'],
    ['liquidation','Thanh lý / Chuyển nhượng'],['reports','Báo cáo / Dashboard']];
  const roleKeys=['admin','bgd','tpkd','ketoan','dvbh'];
  const cell=(rk,cap)=>{ const r=CFG.ROLES[rk]; const ok=r.caps==='*'||r.caps.indexOf(cap)>=0; return ok?'<span style="color:#1f9d3d;font-weight:700">✅</span>':'<span style="color:#c9ccd2">–</span>'; };
  return `<div class="page-title">QUẢN LÝ PHÂN QUYỀN NGƯỜI DÙNG</div>
   <div class="card" style="margin-bottom:18px"><div class="section-title">Tài khoản &amp; vai trò</div>
     <table class="tbl" style="box-shadow:none"><thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>ĐVBH (scope)</th></tr></thead>
     <tbody>${CFG.DEMO_USERS.map(u=>`<tr><td style="font-weight:600">${u.name}</td><td>${u.email}</td><td>${CFG.ROLES[u.role].name}</td><td>${u.dvbh||'Toàn bộ'}</td></tr>`).join('')}</tbody></table></div>
   <div class="card"><div class="section-title">Ma trận phân quyền (5 nhóm vai trò)</div>
     <div style="overflow:auto"><table class="tbl" style="box-shadow:none"><thead><tr><th>Module / Hành động</th>${roleKeys.map(rk=>`<th style="text-align:center">${CFG.ROLES[rk].name}</th>`).join('')}</tr></thead>
     <tbody>${caps.map(c=>`<tr><td style="white-space:nowrap">${c[1]}</td>${roleKeys.map(rk=>`<td style="text-align:center">${cell(rk,c[0])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
     <div class="hint" style="margin-top:10px">✅ Có quyền · – Không truy cập. Admin·IT có toàn quyền (*). Phạm vi dữ liệu: TPKD/Kế toán theo dự án được gán; Đại lý chỉ thấy giao dịch ĐVBH mình.</div>
   </div>`;
};

/* ---- TVV ---- */
SCREENS.tvv=()=>{
  // gộp TVV từ users vai trò dvbh + các tvv xuất hiện trong sản phẩm
  const set={};
  CFG.DEMO_USERS.filter(u=>u.role==='dvbh').forEach(u=>set[u.name]={name:u.name,dvbh:u.dvbh,email:u.email});
  Store.products().forEach(p=>{ if(p.tvv && !set[p.tvv]) set[p.tvv]={name:p.tvv,dvbh:p.dvbh||'',email:''}; });
  const all=Object.values(set);
  window._tvvAll=all;
  Filt.reg('tvv',tvvResults);
  return `<div class="page-title">DANH SÁCH TVV</div>
   <div class="toolbar">${Filt.searchBox('tvv',260)}<div class="spacer"></div>
     <button class="btn btn-primary" onclick="toast('Mở form thêm TVV')">＋ Tạo mới</button></div>
   <div id="tvv-res">${tvvResults()}</div>`;
};
function tvvResults(){
  const f=Filt.st('tvv'); const list=(window._tvvAll||[]).filter(t=>Filt.any(f.q, t.name, t.dvbh, t.email));
  return `<table class="tbl"><thead><tr><th>STT</th><th>Tư vấn viên</th><th>ĐVBH</th><th>Email</th><th>Số căn phụ trách</th></tr></thead>
   <tbody>${list.map((t,i)=>{const n=Store.products().filter(p=>p.tvv===t.name).length;
     return `<tr><td>${i+1}</td><td style="font-weight:600">${t.name}</td><td>${t.dvbh}</td><td>${t.email}</td><td>${n}</td></tr>`;}).join('')||`<tr><td colspan="5" style="text-align:center;color:#9aa3af;padding:30px">Không có TVV phù hợp</td></tr>`}</tbody></table>
   ${pagerN('Hiển thị '+list.length+' bản ghi',1)}`;
}

/* ---- Báo cáo ---- */
SCREENS.reports=()=>{
  const counts=Store.statusCounts();
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const sold=(counts.da_coc||0)+(counts.hop_dong||0);
  const deal=(counts.giu_cho||0)+(counts.dat_cho||0)+(counts.dang_ky||0)+(counts.kiem_tra||0)+(counts.cho_duyet||0);
  const revenue=Store.products().filter(p=>p.status==='da_coc'||p.status==='hop_dong').reduce((a,p)=>a+(p.giaVAT||0),0);
  const kpi=(label,val,color)=>`<div class="card" style="flex:1;min-width:180px"><div style="font-size:12px;color:var(--muted)">${label}</div><div style="font-size:24px;font-weight:800;color:${color||'var(--blue2)'};margin-top:4px">${val}</div></div>`;
  return `<div class="page-title">BÁO CÁO TỔNG HỢP</div>
   <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:18px">
     ${kpi('Tổng sản phẩm',total)}
     ${kpi('Đang giao dịch',deal,'#E07A1E')}
     ${kpi('Đã cọc / hợp đồng',sold,'#1f9d3d')}
     ${kpi('Doanh số (có VAT)',fmtVN(revenue)+' đ','#1B7F3B')}
   </div>
   ${dashboardHTML()}`;
};

/* ---- Chủ đầu tư ---- */
function investorsResults(){
  const set={}; Store.get().projects.forEach(p=>{ set[p.chuDauTu]=(set[p.chuDauTu]||0)+1; });
  const f=Filt.st('inv'); const list=Object.entries(set).filter(r=>Filt.any(f.q, r[0]));
  return `<table class="tbl"><thead><tr><th>STT</th><th>Chủ đầu tư</th><th>Số dự án</th></tr></thead>
   <tbody>${list.map((r,i)=>`<tr><td>${i+1}</td><td style="font-weight:600">${r[0]}</td><td>${r[1]}</td></tr>`).join('')||`<tr><td colspan="3" style="text-align:center;color:#9aa3af;padding:30px">Không có kết quả</td></tr>`}</tbody></table>`;
}
SCREENS.investors=()=>{ Filt.reg('inv',investorsResults); return `<div class="page-title">DANH SÁCH CHỦ ĐẦU TƯ</div>
   <div class="toolbar">${Filt.searchBox('inv',230)}<div class="spacer"></div>
     <button class="btn btn-primary" onclick="toast('Mở form chủ đầu tư')">＋ Tạo mới</button></div>
   <div id="inv-res">${investorsResults()}</div>`; };

/* ---- Lịch sử tải nhập (Dự án) ---- */
function impLogRows(){ return [['BangHang_CT7.xlsx','Bảng hàng','Trần Nguyễn Huy','24/06/2026 08:10','312','312','0','Hoàn tất'],
     ['CapNhatGia_CT7.xlsx','Cập nhật giá','Mai Văn Trí','22/06/2026 14:25','312','310','2','Hoàn tất']]; }
function impLogResults(){
  const f=Filt.st('implog'); const list=impLogRows().filter(r=>Filt.any(f.q, r[0], r[1], r[2]));
  return `<table class="tbl"><thead><tr><th>STT</th><th>Tên file</th><th>Loại</th><th>Người tải</th><th>Thời gian</th><th>Số dòng</th><th>Thành công</th><th>Lỗi</th><th>Trạng thái</th></tr></thead>
   <tbody>${list.map((r,i)=>`<tr><td>${i+1}</td><td class="code">${r[0]}</td><td>${r[1]}</td><td style="white-space:nowrap">${r[2]}</td><td style="white-space:nowrap">${r[3]}</td><td>${r[4]}</td><td style="color:#1f9d3d">${r[5]}</td><td style="color:${r[6]==='0'?'#5b6573':'#d0392b'}">${r[6]}</td><td>${stPill('Đã duyệt').replace('Đã duyệt',r[7])}</td></tr>`).join('')||`<tr><td colspan="9" style="text-align:center;color:#9aa3af;padding:30px">Không có file phù hợp</td></tr>`}</tbody></table>`;
}
SCREENS.importlog=()=>{ Filt.reg('implog',impLogResults); return `<div class="page-title">LỊCH SỬ TẢI NHẬP</div>
   <div class="toolbar">${Filt.searchBox('implog',230)}<div class="spacer"></div>
     <button class="btn btn-primary" onclick="toast('Tải lên file bảng hàng')">⬆ Tải lên</button></div>
   <div id="implog-res">${impLogResults()}</div>`; };

/* ---- Bàn giao ---- */
function handoverResults(){
  const f=Filt.st('hand'); const list=Store.products().filter(p=>p.status==='hop_dong').filter(p=>Filt.any(f.q, p.ma, p.khName, p.dvbh));
  return `<table class="tbl"><thead><tr><th>STT</th><th>Mã căn</th><th>Khách hàng</th><th>ĐVBH</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
   <tbody>${list.map((p,i)=>`<tr><td>${i+1}</td><td class="code" onclick="openProduct('${p.ma}')">${p.ma}</td><td>${p.khName}</td><td>${p.dvbh}</td><td><span class="badge-status bg-wait">Chờ bàn giao</span></td><td><a href="#" onclick="toast('Xác nhận bàn giao ${p.ma}');return false">Bàn giao</a></td></tr>`).join('')||`<tr><td colspan="6" style="text-align:center;color:#9aa3af;padding:40px">Chưa có căn nào sẵn sàng bàn giao (cần lên HĐ Mua bán)</td></tr>`}</tbody></table>`;
}
SCREENS.handover=()=>{ Filt.reg('hand',handoverResults); return `<div class="page-title">BÀN GIAO</div>
   <div class="toolbar">${Filt.searchBox('hand',260)}<div class="spacer"></div>
     <button class="btn btn-primary" onclick="toast('Tạo phiếu bàn giao')">＋ Tạo phiếu bàn giao</button></div>
   <div id="hand-res">${handoverResults()}</div>`; };

/* ---- fallback ---- */
SCREENS._todo=()=>{
  const map={payments:'THANH TOÁN',accounting:'KẾ TOÁN',contracts:'HỢP ĐỒNG',policy:'CHÍNH SÁCH BÁN HÀNG'};
  const t=map[App.route]||'MODULE';
  return `<div class="page-title">${t}</div><div class="card">Chọn một mục con ở menu bên trái.</div>`;
};
