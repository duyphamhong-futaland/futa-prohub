/* ============================================================
   FUTA Land — Prohub  ·  screens-profile.js
   Hồ sơ cá nhân (Tài khoản) của người đang đăng nhập + Nhật ký thao tác
   (lưu vết ai làm thao tác gì). Giống apps.futaland.vn/profile.
   ============================================================ */
window.SCREENS = window.SCREENS || {};

let profileTab='info';
let auditMine=false;   // toggle xem: tất cả người dùng / chỉ của tôi
function setProfileTab(t){ profileTab=t; App.renderContent(); window.scrollTo(0,0); }

function auditScopeAll(){ const u=Perm.user()||{}; return ['admin','bgd','tpkd'].indexOf(u.role)>=0; }
function roleName(r){ return (CFG.ROLES[r]||{}).name || r || ''; }

SCREENS.profile=()=>{
  const u=Perm.user()||{};
  const menu=[['info','👤','Thông tin tài khoản'],['pass','🔒','Đổi mật khẩu'],
    ['social','🌐','Mạng xã hội'],['friends','🤝','Giới thiệu bạn bè'],['activity','🕘','Lịch sử hoạt động']];
  const card=`
    <div class="pf-top">
      <div class="pf-avatar">${u.ini||'--'}</div>
      <div class="pf-name">${u.name||'—'}</div>
      <div class="pf-role">${u.chucVu||roleName(u.role)} - ${u.phongBan||'FUTA Land'}</div>
    </div>
    <div class="pf-rank">
      <div class="r-top"><span class="r-l">${u.rank||'NEW - L.0'}</span><span class="r-p">${(u.points||0)} điểm</span></div>
      <div class="r-sub">Đạt thêm ${Math.max(0,40-(u.points||0))} điểm nâng hạng Bronze</div>
    </div>
    <div class="pf-menu">${menu.map(m=>`<div class="pf-item ${profileTab===m[0]?'on':''}" onclick="setProfileTab('${m[0]}')"><span>${m[1]}</span><span>${m[2]}</span><span class="chev">›</span></div>`).join('')}</div>`;
  return `<div class="pf-wrap">
    <div class="card pf-card">${card}</div>
    <div class="card pf-right" id="profile-body">${profileBody(u)}</div>
  </div>`;
};

function pfRow(k,v){ const empty=!v; return `<div class="pf-row"><div class="k">${k}:</div><div class="v ${empty?'empty':''}">${v||'—'}</div></div>`; }

function profileBody(u){
  if(profileTab==='pass') return `
    <div class="section-title">Đổi mật khẩu</div>
    ${frow('Mật khẩu hiện tại',1,`<input class="inp" type="password" placeholder="Nhập mật khẩu hiện tại">`)}
    ${frow('Mật khẩu mới',1,`<input class="inp" type="password" placeholder="Tối thiểu 8 ký tự">`)}
    ${frow('Xác nhận mật khẩu mới',1,`<input class="inp" type="password" placeholder="Nhập lại mật khẩu mới">`)}
    <div class="save-row" style="justify-content:flex-start;margin-top:8px"><button class="btn btn-primary" onclick="toast('Đã cập nhật mật khẩu (demo)')">Cập nhật mật khẩu</button></div>`;
  if(profileTab==='social') return `
    <div class="section-title">Mạng xã hội</div>
    ${frow('Facebook',0,inp('','https://facebook.com/...'))}
    ${frow('Zalo',0,inp(u.sdt||'','Số Zalo'))}
    ${frow('LinkedIn',0,inp('','https://linkedin.com/in/...'))}
    <div class="save-row" style="justify-content:flex-start;margin-top:8px"><button class="btn btn-primary" onclick="toast('Đã lưu liên kết MXH (demo)')">Lưu</button></div>`;
  if(profileTab==='friends') return `
    <div class="section-title">Giới thiệu bạn bè</div>
    <div class="note-bar">Chia sẻ mã giới thiệu để nhận điểm thưởng khi bạn bè tham gia.</div>
    ${frow('Mã giới thiệu của bạn',0,`<div class="with-btn">${inp((u.id||'REF').toUpperCase())}<button class="btn btn-ghost btn-sm" onclick="toast('Đã sao chép mã')">📋 Sao chép</button></div>`)}
    <div style="color:#9aa3af;text-align:center;padding:30px 0">Chưa có lượt giới thiệu nào.</div>`;
  if(profileTab==='activity') return activityBody(u);
  // info
  const rows=[['Họ và tên',u.name],['Số CCCD',u.cccd],['Ngày cấp',u.ngayCap],['Nơi cấp',u.noiCap],
    ['Mã số thuế',u.mst],['Số điện thoại',u.sdt],['Email',u.email],['Email dự phòng',u.emailDuPhong],
    ['Khu vực làm việc',u.khuVuc],['Chức vụ',u.chucVu],['Phòng ban',u.phongBan]];
  return `<div style="display:flex;align-items:center;justify-content:space-between">
      <div class="section-title" style="margin:0">Thông tin tài khoản</div>
      <span style="color:var(--blue2);cursor:pointer;font-size:16px" title="Chỉnh sửa" onclick="toast('Mở chỉnh sửa hồ sơ (demo)')">✎</span></div>
    <div style="margin-top:12px">${rows.map(r=>pfRow(r[0],r[1])).join('')}</div>`;
}

/* ---- Lịch sử hoạt động / Nhật ký thao tác (lưu vết người dùng) ---- */
function auditResults(){
  const u=Perm.user()||{}; const all=auditScopeAll();
  let list=Store.auditList();
  if(!all || auditMine) list=list.filter(a=>a.userId===u.id);
  const f=Filt.st('audit');
  list=list.filter(a=>Filt.any(f.q, a.userName, a.action, a.target, roleName(a.role)));
  return `<div style="overflow:auto"><table class="tbl"><thead><tr>
    <th>Thời gian</th><th>Người thực hiện</th><th>Vai trò</th><th>Hành động</th><th>Đối tượng</th></tr></thead>
    <tbody>${list.map(a=>`<tr>
      <td style="white-space:nowrap">${a.at}</td>
      <td style="white-space:nowrap;font-weight:600">${a.userName}</td>
      <td style="white-space:nowrap">${roleName(a.role)}</td>
      <td>${a.action}</td>
      <td>${a.target?`<span class="code">${a.target}</span>`:''}</td></tr>`).join('')
      ||`<tr><td colspan="5" style="text-align:center;color:#9aa3af;padding:34px">Chưa có thao tác nào</td></tr>`}</tbody></table></div>
    ${pagerN('Hiển thị '+list.length+' bản ghi',1)}`;
}
function activityBody(u){
  Filt.reg('audit',auditResults);
  const all=auditScopeAll();
  const toggle = all ? `<div class="vt" style="margin-left:auto">
      <button class="${!auditMine?'on':''}" onclick="auditSetScope(false)">Tất cả người dùng</button>
      <button class="${auditMine?'on':''}" onclick="auditSetScope(true)">Chỉ của tôi</button></div>` : '';
  return `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
      <div class="section-title" style="margin:0">Nhật ký thao tác</div>
      ${all?'<span class="hint" style="display:inline">Bạn có quyền xem thao tác của mọi người dùng</span>':'<span class="hint" style="display:inline">Bạn chỉ xem được thao tác của chính mình</span>'}
      ${toggle}</div>
    <div style="margin-bottom:12px">${Filt.searchBox('audit',280)}</div>
    <div id="audit-res">${auditResults()}</div>`;
}
function auditSetScope(mine){ auditMine=mine; App.renderContent(); }
