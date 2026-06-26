/* ============================================================
   FUTA Land — Prohub  ·  store.js
   Kho dữ liệu trung tâm (localStorage). Mọi màn hình ĐỌC từ Store và
   GHI qua Store, nên dữ liệu luôn nhất quán xuyên suốt các module.
   ============================================================ */
const Store = (function(){
  const KEY = "futa_prohub_state";
  const SESS = "futa_prohub_session";
  let state = null;
  const listeners = [];

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(raw){
        const s = JSON.parse(raw);
        if(s && s.version === 8){ if(!s.attachments) s.attachments={}; if(!s.audit) s.audit=[]; if(!s.refunds) s.refunds=[]; if(!s.erpLog) s.erpLog=[]; if(!s.dxhome) s.dxhome=[]; state = s; return; }
      }
    }catch(e){ console.warn("Store load lỗi:", e); }
    state = SEED();
    save();
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){ console.warn(e); } }
  function reset(){ state = SEED(); save(); emit(); }
  /* thay toàn bộ state (dùng khi kéo dữ liệu từ cloud về) */
  function replaceState(s){ if(!s) return; if(!s.attachments) s.attachments={}; state = s; save(); emit(); }

  function emit(){ listeners.forEach(fn=>{ try{ fn(); }catch(e){ console.warn(e); } }); }
  function subscribe(fn){ listeners.push(fn); }

  /* ---- session (đăng nhập) ---- */
  function getSession(){ try{ return JSON.parse(localStorage.getItem(SESS)||"null"); }catch(e){ return null; } }
  function setSession(userId){ localStorage.setItem(SESS, JSON.stringify({userId, at:Date.now()})); }
  function clearSession(){ localStorage.removeItem(SESS); }
  function currentUser(){
    const s = getSession(); if(!s) return null;
    return CFG.DEMO_USERS.find(u=>u.id===s.userId) || null;
  }

  /* ---- truy vấn ---- */
  const get = ()=>state;
  function products(){ return state.products; }
  function product(ma){ return state.products.find(p=>p.ma===ma); }
  function customer(id){ return state.customers.find(c=>c.id===id); }
  function customerByName(name){ return state.customers.find(c=>c.name===name); }

  /* Đếm số căn theo trạng thái (cho legend bảng hàng + dashboard) */
  function statusCounts(filter){
    const out = {}; CFG.PSTATUS_ORDER.forEach(k=>out[k]=0);
    state.products.forEach(p=>{
      if(filter && !filter(p)) return;
      if(out[p.status]===undefined) out[p.status]=0;
      out[p.status]++;
    });
    return out;
  }

  /* sinh mã tự tăng theo tiền tố */
  function nextCode(kind, prefix, pad){
    const num = state.seq[kind]++;
    save();
    return prefix + String(num).padStart(pad||5,"0");
  }

  /* ---- ghi (mutation chung) ---- */
  function mutate(fn){
    const r = fn(state);
    save(); emit();
    return r;
  }
  /* thêm bản ghi lịch sử cho 1 sản phẩm + ghi vào nhật ký chung */
  function pushHistory(product, text){
    const u=currentUser()||{}; const at=new Date().toLocaleString("vi-VN");
    product.history = product.history || [];
    product.history.unshift({t:text, by:u.name||"Hệ thống", at});
    audit(text, product.ma);
  }
  /* nhật ký thao tác (ai làm gì, lúc nào) */
  function audit(action, target, detail){
    const u=currentUser()||{};
    state.audit = state.audit || [];
    state.audit.unshift({id:'a'+Date.now().toString(36)+Math.floor(Math.random()*1e3),
      at:new Date().toLocaleString("vi-VN"), userId:u.id||'', userName:u.name||'Hệ thống',
      role:u.role||'', action, target:target||'', detail:detail||''});
    if(state.audit.length>1000) state.audit.length=1000;
    save();
  }
  function auditList(){ return state.audit || []; }
  function notify(body, cat, title){
    state.notifications.unshift({id:'n'+Date.now().toString(36)+Math.floor(Math.random()*1e3),
      title:title||'Thông báo', body, cat:cat||'Khác', at:new Date().toLocaleString("vi-VN"), read:false});
    if(state.notifications.length>200) state.notifications.length=200;
  }
  function markAllRead(){ (state.notifications||[]).forEach(n=>n.read=true); save(); emit(); }
  function unreadCount(){ return (state.notifications||[]).filter(n=>!n.read).length; }

  /* ---- tệp đính kèm (uploader) ---- */
  function attachments(slot){ return (state.attachments && state.attachments[slot]) || []; }
  function addAttachment(slot, rec){
    if(!state.attachments) state.attachments={};
    (state.attachments[slot] = state.attachments[slot] || []).push(rec);
    save();
  }
  function removeAttachment(slot, id){
    const a = state.attachments && state.attachments[slot]; if(!a) return;
    const i = a.findIndex(x=>x.id===id); if(i>=0) a.splice(i,1);
    save();
  }

  return {
    load, save, reset, replaceState, subscribe, emit,
    getSession, setSession, clearSession, currentUser,
    get, products, product, customer, customerByName,
    statusCounts, nextCode, mutate, pushHistory, notify, markAllRead, unreadCount,
    audit, auditList,
    attachments, addAttachment, removeAttachment,
  };
})();
