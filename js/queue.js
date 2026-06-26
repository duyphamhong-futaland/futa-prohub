/* ============================================================
   FUTA Land — Prohub  ·  queue.js
   Hàng đợi ưu tiên + timeout tự trả (đúng "Tính năng Hàng Đợi" Prohub):
   nhiều claim cùng tranh 1 căn → xếp Ưu Tiên 1/2/3. Ưu tiên 1 được giữ
   trong N phút (đếm ngược); hết giờ tự trả, đẩy ưu tiên kế tiếp lên.
   ============================================================ */
const Queue = (function(){
  let timer = null;

  function holdMin(){ return (Store.get().ctbh && Store.get().ctbh.holdMin) || CFG.QUEUE.defaultHoldMin; }
  function holdMs(){ return Math.max(1, holdMin()) * 60000; }
  function startHold(p){ p.holdUntil = Date.now() + holdMs(); }
  function clearHold(p){ p.holdUntil = null; }
  function remaining(p){ return p.holdUntil ? Math.max(0, p.holdUntil - Date.now()) : 0; }
  function fmt(ms){ const s=Math.ceil(ms/1000); return Math.floor(s/60)+':'+String(Math.max(0,s%60)).padStart(2,'0'); }

  /* gán thông tin "người giữ hiện tại" = ưu tiên 1 */
  function setHolderFromQueue(st, p){
    const q0 = (p.queue||[])[0];
    if(q0){ p.khName=q0.kh; p.dvbh=q0.dvbh||''; p.tvv=q0.tvv||''; p.customerId=q0.customerId||p.customerId; }
    else { p.khName=''; p.dvbh=''; p.tvv=''; p.customerId=null; }
  }
  function releaseClaim(st, claim, ycdchStatus){
    if(!claim) return;
    const y = st.ycdch.find(x=>x.ma===claim.ycdchMa); if(y) y.status = ycdchStatus || 'da_hoan';
    if(claim.ycdcoMa){ const o = st.ycdco.find(x=>x.ma===claim.ycdcoMa); if(o) o.status='tu_choi'; }
  }

  /* Hết giờ giữ: bỏ ưu tiên 1, đẩy ưu tiên kế lên, hoặc trả về mở bán */
  function expire(st, p){
    const q = p.queue || [];
    const left = q.shift();                 // ưu tiên 1 rời hàng đợi
    releaseClaim(st, left, 'da_hoan');
    Store.pushHistory(p, `Ưu tiên 1 (${left? left.kh : '—'}) hết giờ → trả chỗ`);
    if(q.length){
      setHolderFromQueue(st, p);
      p.status = 'giu_cho';
      startHold(p);
      Store.pushHistory(p, `Đẩy Ưu tiên kế tiếp → giữ chỗ: ${p.khName}`);
      Store.notify(`Căn ${p.ma}: ${p.khName} lên Ưu tiên 1`);
    } else {
      p.status = 'mo_ban';
      setHolderFromQueue(st, p);            // clear holder
      clearHold(p);
      Store.notify(`Căn ${p.ma}: hết hàng đợi → mở bán lại`);
    }
  }

  /* vòng lặp 1s: đếm ngược + xử lý hết giờ */
  function tick(){
    const st = Store.get(); if(!st) return;
    let changed = false;
    st.products.forEach(p=>{
      if(p.holdUntil && (p.status==='giu_cho'||p.status==='dang_ky') && Date.now() >= p.holdUntil){
        expire(st, p); changed = true;
      }
    });
    if(changed){
      Store.save();
      if(typeof App!=='undefined' && document.getElementById('app').style.display!=='none') App.rerender();
      if(window._openProductMa && typeof openProduct==='function') openProduct(window._openProductMa);
    } else {
      // chỉ cập nhật chữ đếm ngược, không re-render
      document.querySelectorAll('[data-countdown]').forEach(el=>{
        el.textContent = fmt(Math.max(0, (+el.dataset.countdown) - Date.now()));
      });
    }
  }
  function start(){ if(!timer) timer = setInterval(tick, 1000); }

  /* test demo: ép hết giờ ưu tiên 1 ngay */
  function forceExpire(ma){
    Store.mutate(st=>{ const p=st.products.find(x=>x.ma===ma); if(p) p.holdUntil = Date.now()-1; });
    tick();
  }
  /* đổi thời gian giữ (phút) */
  function setHold(min){
    min = Math.max(1, parseInt(min)||10);
    Store.mutate(st=>{ st.ctbh.holdMin = min; });
    toast('Đã đặt thời gian giữ ưu tiên = '+min+' phút');
  }

  return { start, tick, expire, startHold, clearHold, remaining, fmt, holdMin, setHolderFromQueue, releaseClaim, forceExpire, setHold };
})();
