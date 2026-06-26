/* ============================================================
   FUTA Land — Prohub  ·  app.js
   Bootstrap: đăng nhập theo vai trò, sidebar (lọc theo quyền), router,
   topbar, re-render sau mỗi mutation.
   ============================================================ */
const App = (function(){
  let route = "projects";
  let openGroups = new Set(["projects"]);

  function boot(){
    Store.load();
    Queue.start();
    if(typeof Sync!=='undefined') Sync.init();
    renderRoleGrid();
    const u = Store.currentUser();
    if(u){ enter(); } else { document.getElementById('login').style.display='flex'; }
  }

  /* ---- LOGIN ---- */
  function renderRoleGrid(){
    const g=document.getElementById('roleGrid'); if(!g) return;
    g.innerHTML = CFG.DEMO_USERS.map(u=>{
      const r=CFG.ROLES[u.role];
      return `<button class="role-chip" onclick="App.loginAs('${u.id}')">
        <span class="ra">${u.ini}</span>
        <span><span class="rn">${r.name}</span><br><span class="rd">${u.name}</span></span></button>`;
    }).join('');
  }
  function login(){
    const v=(document.getElementById('loginUser')||{}).value||'';
    let u = CFG.DEMO_USERS.find(x=>x.email===v.trim() || x.name===v.trim());
    if(!u){
      // cho phép đăng nhập demo: trống → admin
      if(!v.trim()){ u = CFG.DEMO_USERS[0]; }
      else { document.getElementById('errUser').classList.remove('hidden'); toast('Tài khoản không tồn tại. Dùng đăng nhập nhanh bên dưới.','warn'); return; }
    }
    loginAs(u.id);
  }
  function loginAs(userId){
    Store.setSession(userId);
    Store.audit('Đăng nhập hệ thống');
    document.getElementById('login').style.display='none';
    enter();
  }
  function logout(){
    closeNotif(); closeUserMenu();
    Store.clearSession();
    document.getElementById('app').style.display='none';
    document.getElementById('login').style.display='flex';
  }

  /* ---- thu gọn sidebar ---- */
  function toggleSidebar(){ document.body.classList.toggle('nav-collapsed'); }

  /* ---- dropdown Thông báo ---- */
  let notifTab='Tất cả';
  const NOTIF_TABS=['Tất cả','Yêu cầu','Hợp đồng','Giao dịch','Cuộc gọi','Khác'];
  function toggleNotif(e){ if(e) e.stopPropagation(); closeUserMenu();
    const p=document.getElementById('notifPanel');
    if(p.classList.contains('hidden')){ renderNotif(); p.classList.remove('hidden'); } else p.classList.add('hidden'); }
  function closeNotif(){ const p=document.getElementById('notifPanel'); if(p) p.classList.add('hidden'); }
  function notifSetTab(t){ notifTab=t; renderNotif(); }
  function markAllReadUI(){ Store.markAllRead(); renderNotif(); updateTopbar(); }
  function openNotifItem(id){ Store.mutate(st=>{ const n=(st.notifications||[]).find(x=>x.id===id); if(n) n.read=true; }); renderNotif(); updateTopbar(); }
  function notifSeeAll(){ closeNotif(); toast('Trang Thông báo đầy đủ (demo)'); }
  function renderNotif(){
    const all=Store.get().notifications||[];
    const list = notifTab==='Tất cả' ? all : all.filter(n=>(n.cat||'Khác')===notifTab);
    const icon=c=>({'Yêu cầu':'📝','Hợp đồng':'📑','Giao dịch':'💳','Cuộc gọi':'📞','Khác':'🔔'}[c]||'🔔');
    const items = list.length ? list.map(n=>`
      <div class="notif-item ${n.read?'read':''}" onclick="App.openNotifItem('${n.id}')">
        <div class="notif-ic">${icon(n.cat)}</div>
        <div class="notif-bd"><div class="notif-tt"><b>${n.title||'Thông báo'}</b><span class="time">${n.at||''}</span></div>
          <div class="notif-msg">${n.body||n.t||''}</div></div></div>`).join('')
      : `<div class="notif-empty">Không có thông báo</div>`;
    document.getElementById('notifPanel').innerHTML=`
      <div class="notif-h"><b>Thông báo</b><a onclick="App.markAllReadUI()">Đánh dấu tất cả là đã đọc</a></div>
      <div class="notif-tabs">${NOTIF_TABS.map(t=>`<div class="notif-tab ${t===notifTab?'on':''}" onclick="App.notifSetTab('${t}')">${t}</div>`).join('')}</div>
      <div class="notif-list">${items}</div>
      <div class="notif-foot" onclick="App.notifSeeAll()">Xem tất cả thông báo</div>`;
  }

  /* ---- menu người dùng ---- */
  function toggleUserMenu(e){ if(e) e.stopPropagation(); closeNotif();
    const m=document.getElementById('userMenu');
    if(m.classList.contains('hidden')){ renderUserMenu(); m.classList.remove('hidden'); } else m.classList.add('hidden'); }
  function closeUserMenu(){ const m=document.getElementById('userMenu'); if(m) m.classList.add('hidden'); }
  function renderUserMenu(){
    const u=Perm.user()||{}; const r=CFG.ROLES[u.role]||{};
    const s=(typeof Sync!=='undefined')?Sync.status():{label:'Local',color:'#9aa3af'};
    document.getElementById('userMenu').innerHTML=`
      <div class="um-head"><div class="avatar">${u.ini||'--'}</div><div><b>${u.name||'—'}</b><small>${r.name||''}</small></div></div>
      <div class="um-item" onclick="App.closeUserMenu();Sync.openConnect()"><span class="um-dot" style="background:${s.color}"></span> ${s.label}</div>
      <div class="um-item" onclick="App.closeUserMenu();go('profile')">👤 Hồ sơ của tôi</div>
      <div class="um-item danger" onclick="App.logout()">⎋ Đăng xuất</div>`;
  }

  function enter(){
    document.getElementById('login').style.display='none';
    document.getElementById('app').style.display='block';
    updateTopbar();
    renderNav();
    // route mặc định hợp lệ với quyền
    const start = Perm.can('projects.view') ? 'projects' : (Perm.visibleNav()[0]||{key:'projects'}).key;
    go(start);
  }

  function updateTopbar(){
    const u=Perm.user()||{}; const r=CFG.ROLES[u.role]||{};
    document.getElementById('userAvatar').textContent=u.ini||'--';
    document.getElementById('userName').textContent=u.name||'—';
    document.getElementById('userRole').textContent=r.name||'';
    const n=Store.unreadCount(); const b=document.getElementById('bellBadge');
    b.textContent=n>99?'99+':n; b.classList.toggle('hidden', n===0);
    if(typeof Sync!=='undefined') Sync.updatePill();
  }
  function bellCount(){
    const st=Store.get(); const u=Perm.user()||{}; let n=0;
    if(Perm.can('accounting.approve')){ n+=st.payReqs.filter(r=>r.status==='cho_duyet').length; n+=st.ycdco.filter(y=>y.status==='cho_kt').length; n+=st.hdCoc.filter(h=>h.status==='cho_kt').length; }
    if(Perm.can('policy.approve')) n+=st.polTT.concat(st.polCK).filter(p=>p.status==='cho_duyet').length;
    if(Perm.can('contract.manage')) n+=st.products.filter(p=>p.status==='kiem_tra').length;
    if(u.role==='dvbh') n+=st.ycdch.filter(y=>y.status==='cho_xn'&&Perm.inScope(y.dvbh)).length;
    return n;
  }

  /* ---- SIDEBAR ---- */
  function renderNav(){
    const sb=document.getElementById('sidebar'); sb.innerHTML='';
    Perm.visibleNav().forEach(item=>{
      const hasKids=!!item.children;
      const open=openGroups.has(item.key);
      const activeTop=(route===item.key)||(hasKids&&item.children.some(c=>c.key===route));
      const el=document.createElement('div');
      el.className='nav-item'+(open?' open':'')+(activeTop&&!hasKids?' active':'');
      el.innerHTML=`<span class="ico">${item.ico}</span><span>${item.label}</span>`+(hasKids?`<span class="chev">▾</span>`:'');
      el.onclick=()=>{
        if(document.body.classList.contains('nav-collapsed')){ document.body.classList.remove('nav-collapsed'); if(hasKids){ openGroups.add(item.key); renderNav(); return; } }
        if(hasKids){ open?openGroups.delete(item.key):openGroups.add(item.key); renderNav(); } else go(item.key); };
      sb.appendChild(el);
      if(hasKids){
        const sub=document.createElement('div'); sub.className='subnav'+(open?' show':'');
        item.children.forEach(c=>{
          const s=document.createElement('div'); s.className='sub-item'+(route===c.key?' active':'');
          s.textContent=c.label; s.onclick=(e)=>{e.stopPropagation(); go(c.key);};
          sub.appendChild(s);
        });
        sb.appendChild(sub);
      }
    });
  }

  /* ---- ROUTER ---- */
  function go(key){
    if(!Perm.canRoute(key)){ toast('⚠ Bạn không có quyền truy cập mục này','warn'); return; }
    route=key;
    CFG.NAV.forEach(it=>{ if(it.children && it.children.some(c=>c.key===key)) openGroups.add(it.key); });
    if(CFG.ROUTE_GROUP[key]) openGroups.add(CFG.ROUTE_GROUP[key]);
    renderNav();
    document.getElementById('crumb').innerHTML=(CFG.CRUMB[key]||"🏠 Trang chủ").replace(/\//g,'<span class="sep">/</span>');
    renderContent();
    window.scrollTo(0,0);
  }
  function renderContent(){
    const c=document.getElementById('content');
    const fn=(window.SCREENS[route])||window.SCREENS._todo;
    try{ c.innerHTML=fn(); }
    catch(e){ console.error("Render lỗi:",e); c.innerHTML=`<div class="card" style="color:#c0392b">Lỗi hiển thị màn hình «${route}»: ${e.message}</div>`; }
    if(window.AFTER && window.AFTER[route]) window.AFTER[route]();
  }
  /* gọi sau mỗi mutation: cập nhật nav badge + nội dung hiện tại */
  function rerender(){ updateTopbar(); renderNav(); renderContent(); }

  return { boot, login, loginAs, logout, go, renderContent, rerender,
    toggleSidebar, toggleNotif, closeNotif, notifSetTab, markAllReadUI, openNotifItem, notifSeeAll,
    toggleUserMenu, closeUserMenu,
    get route(){return route;}, };
})();

/* đóng dropdown topbar khi bấm ra ngoài */
document.addEventListener('click', ()=>{ App.closeNotif(); App.closeUserMenu(); });

/* global helpers dùng trong onclick inline */
function go(key){ App.go(key); }

/* tự re-render khi store phát tín hiệu (vd reset) */
Store && Store.subscribe(()=>{ /* để các nút chủ động gọi App.rerender; subscribe dự phòng */ });

document.addEventListener('DOMContentLoaded', ()=>App.boot());
