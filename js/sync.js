/* ============================================================
   FUTA Land — Prohub  ·  sync.js   (tùy chọn — Supabase)
   Offline-first. Gọi thẳng PostgREST bằng fetch (không cần CDN/npm).
     - Chưa cấu hình / mất mạng → chạy 100% localStorage.
     - Đã cấu hình + online      → đẩy/kéo cả state (1 dòng JSONB),
       tự đẩy khi dữ liệu đổi (debounce) + poll kéo về định kỳ.

   SQL cần chạy 1 lần trong Supabase (xem Sync.schemaSQL):
     create table futa_prohub (id text primary key, data jsonb,
       updated_at timestamptz default now());
   ============================================================ */
const Sync = (function(){
  const TABLE='futa_prohub', ROW_ID='state', CFG_KEY='prohub_syncCfg';
  let applying=false, pushTimer=null, pollTimer=null, lastPushSig='';

  function cfg(){
    let c=null; try{ c=JSON.parse(localStorage.getItem(CFG_KEY)||'null'); }catch(e){}
    if(!c){ const g=window.FUTA_PROHUB_CONFIG||{}; c={url:g.supabaseUrl||'', anonKey:g.supabaseKey||'', autoSync:g.autoSync!==false}; }
    return c;
  }
  function saveCfg(c){ localStorage.setItem(CFG_KEY, JSON.stringify(c)); }
  function isConfigured(){ const c=cfg(); return !!(c.url && c.anonKey); }
  function isOnline(){ return navigator.onLine; }
  function status(){
    if(!isConfigured()) return {state:'offline', label:'Chưa kết nối (Local)', color:'#9aa3af'};
    if(!isOnline())     return {state:'down',    label:'Mất mạng (Local)',    color:'#E07A1E'};
    return {state:'on', label:'Đã kết nối Supabase', color:'#1f9d3d'};
  }
  function headers(){ const c=cfg(); return {
    'apikey':c.anonKey, 'Authorization':'Bearer '+c.anonKey,
    'Content-Type':'application/json', 'Prefer':'resolution=merge-duplicates' }; }
  function restUrl(path){ return cfg().url.replace(/\/$/,'') + '/rest/v1/' + path; }

  async function testConnection(){
    if(!isConfigured()) throw new Error('Chưa nhập URL và anon key');
    const res=await fetch(restUrl(TABLE+'?select=id&limit=1'), {headers:headers()});
    if(!res.ok){ const t=await res.text().catch(()=> ''); throw new Error('HTTP '+res.status+' – '+(t.slice(0,140)||'Kiểm tra URL/key & đã tạo bảng '+TABLE+' chưa')); }
    return true;
  }
  async function pushAll(){
    if(!isConfigured()) throw new Error('Chưa cấu hình Supabase');
    if(!isOnline()) throw new Error('Đang offline');
    const body=[{id:ROW_ID, data:Store.get(), updated_at:new Date().toISOString()}];
    const res=await fetch(restUrl(TABLE), {method:'POST', headers:headers(), body:JSON.stringify(body)});
    if(!res.ok){ const t=await res.text().catch(()=> ''); throw new Error('Push lỗi HTTP '+res.status+' – '+t.slice(0,140)); }
    lastPushSig=sig(); return 1;
  }
  async function pullAll(){
    if(!isConfigured()||!isOnline()) throw new Error('Không có kết nối');
    const res=await fetch(restUrl(TABLE+'?id=eq.'+ROW_ID+'&select=data'), {headers:headers()});
    if(!res.ok) throw new Error('Pull lỗi HTTP '+res.status);
    const rows=await res.json();
    if(rows && rows[0] && rows[0].data){
      applying=true;
      try{ Store.replaceState(rows[0].data); if(typeof App!=='undefined') App.rerender(); }
      finally{ applying=false; }
      return true;
    }
    return false;
  }
  function sig(){ try{ return String(JSON.stringify(Store.get()).length); }catch(e){ return ''; } }

  function scheduleAutoPush(){
    const c=cfg(); if(!c.autoSync || !isConfigured() || !isOnline()) return;
    clearTimeout(pushTimer);
    pushTimer=setTimeout(()=>{ if(sig()!==lastPushSig) pushAll().then(updatePill).catch(e=>console.warn('[Sync] push:',e.message)); }, 1500);
  }
  function startPoll(){ if(pollTimer) return; pollTimer=setInterval(()=>{ if(isConfigured()&&isOnline()) pullAll().then(updatePill).catch(()=>{}); }, 20000); }

  function init(){
    // auto-push khi store đổi (trừ lúc đang áp dữ liệu kéo về)
    Store.subscribe(()=>{ if(!applying) scheduleAutoPush(); });
    window.addEventListener('online', updatePill);
    window.addEventListener('offline', updatePill);
    if(isConfigured() && isOnline()){
      pullAll().catch(()=>{}).finally(()=>{ startPoll(); updatePill(); });
    }
    updatePill();
  }

  function updatePill(){
    const el=document.getElementById('syncPill'); if(!el) return;
    const s=status(); el.textContent='🔌 '+s.label; el.style.color=s.color;
  }
  function updatePillAlias(){ updatePill(); }

  /* ---------- UI: modal Kết nối ---------- */
  const schemaSQL =
`-- Chạy 1 lần trong Supabase (SQL Editor)
create table if not exists futa_prohub (
  id text primary key,
  data jsonb,
  updated_at timestamptz default now()
);
alter table futa_prohub enable row level security;
-- DEMO: cho phép anon đọc/ghi (siết lại bằng Supabase Auth khi lên thật)
create policy "prohub anon all" on futa_prohub
  for all to anon using (true) with check (true);`;

  function openConnect(){
    if(typeof Perm!=='undefined' && !Perm.can('*')){ toast('Chỉ Admin·IT được cấu hình kết nối','warn'); return; }
    const c=cfg(); const s=status();
    document.getElementById('modalRoot').innerHTML=`
    <div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="width:680px">
      <div class="modal-h"><b>🔌 Kết nối Supabase (đồng bộ đa máy)</b><button class="x" onclick="closeModal()">×</button></div>
      <div class="modal-b" style="max-height:80vh;overflow:auto">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13px">
          Trạng thái: <b style="color:${s.color}">${s.label}</b></div>
        <div class="note-bar">Để TRỐNG = chạy offline 100%. Điền <b>URL + anon key (public)</b> để đồng bộ. ⚠️ Không dùng service_role key.</div>
        ${frow('Supabase URL',0,inpId('scUrl', c.url, 'https://xxxx.supabase.co'))}
        ${frow('Anon public key',0,inpId('scKey', c.anonKey, 'eyJ...'))}
        <label class="chk" style="margin:6px 0"><input type="checkbox" id="scAuto" ${c.autoSync!==false?'checked':''}><span>Tự đẩy thay đổi lên cloud (debounce)</span></label>
        <div class="modal-actions" style="justify-content:flex-start;flex-wrap:wrap">
          <button class="btn btn-ghost" onclick="Sync.uiTest()">Kiểm tra kết nối</button>
          <button class="btn btn-primary" onclick="Sync.uiSavePush()">💾 Lưu &amp; Đẩy lên</button>
          <button class="btn btn-ghost" onclick="Sync.uiPull()">⬇ Kéo về máy này</button>
          <button class="btn btn-ghost" style="color:var(--red);border-color:var(--red)" onclick="Sync.uiDisconnect()">Ngắt kết nối</button>
        </div>
        <hr class="soft">
        <div style="font-weight:700;color:var(--blue2);font-size:12.5px;margin-bottom:6px">SQL khởi tạo bảng (chạy 1 lần trong Supabase → SQL Editor)</div>
        <textarea class="inp" id="scSQL" readonly style="min-height:150px;font-family:monospace;font-size:11px">${schemaSQL}</textarea>
        <div style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('scSQL').value).then(()=>toast('Đã copy SQL'))">📋 Copy SQL</button></div>
      </div></div></div>`;
  }
  function readForm(){ return { url:(document.getElementById('scUrl')||{}).value||'', anonKey:(document.getElementById('scKey')||{}).value||'', autoSync:(document.getElementById('scAuto')||{}).checked }; }
  async function uiTest(){ saveCfg(readForm()); try{ await testConnection(); toast('Kết nối OK ✓'); }catch(e){ toast('Lỗi: '+e.message,'err'); } updatePill(); }
  async function uiSavePush(){ saveCfg(readForm()); try{ await testConnection(); const n=await pushAll(); toast('Đã lưu & đẩy lên cloud ('+n+' bản ghi state)'); startPoll(); }catch(e){ toast('Lỗi: '+e.message,'err'); } updatePill(); closeModal(); }
  async function uiPull(){ saveCfg(readForm()); try{ const ok=await pullAll(); toast(ok?'Đã kéo dữ liệu từ cloud về':'Cloud chưa có dữ liệu'); }catch(e){ toast('Lỗi: '+e.message,'err'); } updatePill(); closeModal(); }
  function uiDisconnect(){ saveCfg({url:'', anonKey:'', autoSync:true}); clearInterval(pollTimer); pollTimer=null; toast('Đã ngắt kết nối — chạy offline'); updatePill(); closeModal(); }

  return { init, status, testConnection, pushAll, pullAll, openConnect, schemaSQL,
    uiTest, uiSavePush, uiPull, uiDisconnect, isConfigured, updatePill, updatePillAlias };
})();
