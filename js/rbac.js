/* ============================================================
   FUTA Land — Prohub  ·  rbac.js
   Phân quyền mềm tầng UI: ẩn menu, chặn route, khoá hành động theo
   5 nhóm vai trò. Phạm vi dữ liệu (scope) theo dự án / ĐVBH.
   ============================================================ */
const Perm = (function(){
  function user(){ return Store.currentUser(); }
  function role(){ const u=user(); return u ? CFG.ROLES[u.role] : null; }

  function can(cap){
    const r = role(); if(!r) return false;
    if(r.caps === "*") return true;
    if(!cap) return true;
    if(r.caps.indexOf(cap) >= 0) return true;
    // cho phép cap "x.view" nếu có "x.manage" hoặc các cap rộng hơn
    return false;
  }

  /* Lọc nav theo quyền (admin thấy tất cả) */
  function visibleNav(){
    return CFG.NAV.filter(item=>{
      if(can("*")) return true;
      if(!item.cap) return true;
      return can(item.cap);
    });
  }

  function canRoute(key){
    const need = CFG.ROUTE_CAP[key];
    if(!need) return true;
    return can(need);
  }

  /* Phạm vi dữ liệu: ĐVBH chỉ thấy giao dịch của đơn vị mình */
  function scopeDVBH(){ const u=user(); return (u && u.role==="dvbh") ? u.dvbh : null; }
  /* Đại lý chỉ thấy giao dịch/ phiếu thuộc đúng ĐVBH của mình. */
  function inScope(dvbhName){
    const s = scopeDVBH(); if(!s) return true; return dvbhName===s;
  }

  /* Gọi 1 hành động có kiểm quyền; nếu thiếu quyền → toast cảnh báo */
  function guard(cap, fn){
    if(!can(cap)){ if(typeof toast==="function") toast("⚠ Bạn không có quyền thực hiện thao tác này"); return false; }
    return fn ? fn() : true;
  }

  return { user, role, can, visibleNav, canRoute, scopeDVBH, inScope, guard };
})();
