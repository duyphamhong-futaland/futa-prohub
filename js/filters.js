/* ============================================================
   FUTA Land — Prohub  ·  filters.js
   Engine bộ lọc/tìm kiếm THẬT. Mỗi danh sách bọc kết quả trong
   <div id="<key>-res">, ô lọc nằm NGOÀI div đó nên gõ không mất focus;
   khi đổi điều kiện chỉ vẽ lại phần kết quả.
   ============================================================ */
const Filt = (function(){
  const _s={}, _r={};
  function st(k){ return _s[k] || (_s[k]={}); }
  function set(k,patch){ Object.assign(st(k), patch); }
  function clear(k){ _s[k]={}; }
  function reg(k,fn){ _r[k]=fn; }
  function paint(k){ const el=document.getElementById(k+'-res'); if(el && _r[k]) el.innerHTML=_r[k](); }
  function inp(node,k,field){ set(k,{[field]:node.value}); paint(k); }
  function reset(k){ clear(k); if(typeof App!=='undefined') App.rerender(); }

  function txt(h,q){ if(!q) return true; return String(h==null?'':h).toLowerCase().indexOf(String(q).toLowerCase())>=0; }
  function any(q){ const a=[].slice.call(arguments,1); if(!q) return true; return a.some(x=>txt(x,q)); }
  function dmy(s){ const m=/(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(s||'')); return m? new Date(+m[3],+m[2]-1,+m[1]) : null; }
  function inRange(dateStr, from, to){
    const d=dmy(dateStr); if(!d) return true;
    const f=dmy(from); if(f && d<f) return false;
    const t=dmy(to); if(t){ const te=new Date(t); te.setHours(23,59,59,999); if(d>te) return false; }
    return true;
  }

  /* builders (markup khớp giao diện gốc) */
  function search(k, ph, w){ return `<input class="inp" placeholder="${esc(ph||'Tìm kiếm')}" value="${esc(st(k).q||'')}" oninput="Filt.inp(this,'${k}','q')" style="min-width:${w||200}px">`; }
  function searchBox(k, w){ return `<div class="search" style="min-width:${w||230}px">🔍<input placeholder="Tìm kiếm" value="${esc(st(k).q||'')}" oninput="Filt.inp(this,'${k}','q')"></div>`; }
  function sel(k, field, opts){ const cur=st(k)[field]; return `<select class="inp" onchange="Filt.inp(this,'${k}','${field}')">${opts.map(o=>`<option ${o===cur?'selected':''}>${o}</option>`).join('')}</select>`; }
  function date(k, field){ return `<div class="with-btn" style="min-width:150px"><input class="inp" type="text" placeholder="dd/mm/yyyy" value="${esc(st(k)[field]||'')}" oninput="Filt.inp(this,'${k}','${field}')"><button class="btn btn-ghost btn-sm" tabindex="-1">📅</button></div>`; }

  return { st, set, clear, reg, paint, inp, reset, txt, any, dmy, inRange, search, searchBox, sel, date };
})();

/* danh sách dự án (tên) dùng cho select "Dự án" */
function projectOptions(){
  const s=new Set();
  Store.get().projects.forEach(p=>s.add(p.ten));
  Store.get().payReqs.forEach(r=>s.add(r.duAn));
  Store.get().hdCoc.forEach(r=>s.add(r.duAn));
  return [...s].filter(Boolean);
}
