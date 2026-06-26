/* ============================================================
   FUTA Land — Prohub  ·  helpers.js
   Hàm render dùng chung (giữ NGUYÊN markup như bản v3) + tiện ích
   định dạng tiền & badge trạng thái.
   ============================================================ */

/* ---------- form controls (markup y hệt v3) ---------- */
function chk(label,checked,hint){return `<div class="chk"><input type="checkbox" ${checked?'checked':''}><span>${label}${hint?`<div class="hint">${hint}</div>`:''}</span></div>`;}
function frow(label,req,control){return `<div class="frow"><label>${label}${req?' <span class="req">*</span>':''}</label>${control}</div>`;}
function inp(val,ph,cls){return `<input class="inp ${cls||''}" ${val!==undefined?`value="${esc(val)}"`:''} ${ph?`placeholder="${esc(ph)}"`:''}>`;}
function inpId(id,val,ph,cls){return `<input id="${id}" class="inp ${cls||''}" ${val!==undefined&&val!==''?`value="${esc(val)}"`:''} ${ph?`placeholder="${esc(ph)}"`:''}>`;}
function sel(opts){return `<select class="inp">${opts.map(o=>`<option>${o}</option>`).join('')}</select>`;}
function selId(id,opts){return `<select id="${id}" class="inp">${opts.map(o=>`<option value="${esc(o)}">${o}</option>`).join('')}</select>`;}
function datein(v){return `<div class="with-btn">${inp(v||'12/11/2025')}<button class="btn btn-ghost btn-sm">📅</button></div>`;}

/* disabled / read-only controls */
function disInp(v){return `<input class="inp dis" value="${esc(v||'')}" disabled>`;}
function selDis(v){return `<select class="inp dis" disabled><option>${v||''}</option></select>`;}
function dateDis(v){return `<div class="with-btn"><input class="inp dis" value="${esc(v||'')}" disabled><button class="btn btn-ghost btn-sm" style="opacity:.55" disabled>📅</button></div>`;}
function dateDisI(v){return `<div style="position:relative"><input class="inp dis" value="${esc(v||'')}" disabled style="padding-right:30px"><span style="position:absolute;right:9px;top:50%;transform:translateY(-50%);color:#9aa3af;pointer-events:none">📅</span></div>`;}
function naRow(label){return `<div class="frow"><label>${label}</label><div style="color:#9aa3af">N/A</div></div>`;}
function naGeo(label){return `<div class="frow"><label>${label}</label><div style="color:#9aa3af">📍 N/A</div></div>`;}
function moneyRow(label,req){return `<div class="frow"><label>${label}${req?' <span class="req">*</span>':''}</label>
  <div style="display:flex"><input class="inp" value="0" style="border-radius:6px 0 0 6px"><span style="border:1px solid #d6dce6;border-left:none;border-radius:0 6px 6px 0;padding:8px 13px;background:#f3f5f8;color:#6b7785">VNĐ</span></div></div>`;}
function searchSel(ph){return `<div style="display:flex;align-items:center;border:1px solid #d6dce6;border-radius:6px;background:#fff;padding:0 8px">
  <input class="inp" placeholder="${esc(ph||'')}" style="border:none;flex:1;padding:9px 2px"><span style="color:#b0b6c0;cursor:pointer">✕</span><span style="color:#8a93a0;margin-left:8px">▾</span></div>`;}
/* uploader THẬT: slot mặc định theo route+title (mỗi vị trí 1 slot persist riêng).
   Truyền slot tường minh khi gắn theo bản ghi (vd theo mã hợp đồng/chính sách). */
function bigUpload(title,sub,slot){
  slot = slot || ((typeof App!=='undefined'? App.route : 'x') + '|' + title);
  return Uploader.render(slot, {title, sub});
}
function fileList(files){return `<div style="border:1px solid var(--line);border-radius:8px;margin-top:12px">
  <div style="padding:9px 14px;border-bottom:1px solid var(--line);color:#3a4658;font-size:12.5px">Tên file</div>
  ${files.map(f=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #eef1f5">
    <span style="color:#8a93a0">📄</span><a href="#" onclick="return false" style="flex:1;font-weight:600;line-height:1.4">${f}</a><span style="color:#b0b6c0;cursor:pointer;font-size:15px">✕</span></div>`).join('')}</div>`;}
function radioInline(name,opts,selVal,onclick){return opts.map(o=>`<label class="chk" style="display:inline-flex;margin:0"><input type="radio" name="${name}" ${o[0]===selVal?'checked':''} ${onclick?`onclick="${onclick}('${o[0]}')"`:''}> ${o[1]}</label>`).join('');}

/* ---------- filter toolbar ---------- */
function fField(label,inner){return `<div style="display:flex;flex-direction:column;gap:5px"><label style="font-size:12.5px;color:#3a4658;font-weight:600">${label}</label>${inner}</div>`;}
function fDate(label,v){return fField(label,`<div class="with-btn" style="min-width:160px"><input class="inp" value="${v}" style="background:#f7f9fc"><button class="btn btn-ghost btn-sm">📅</button></div>`);}
function rightBtns(html){return `<div style="display:flex;flex-direction:column;gap:5px"><label style="font-size:12.5px;color:transparent">.</label><div style="display:flex;gap:10px">${html}</div></div>`;}
/* Thanh lọc THẬT — o.key bắt buộc; kết quả vẽ trong #<key>-res. */
function filterBar(o){
  o=o||{}; const k=o.key||'flt'; const f=[];
  f.push(fField('Tìm kiếm từ khóa', Filt.search(k,'Nhập từ khoá',170)));
  if(o.denghi)    f.push(fField('Loại phiếu', Filt.sel(k,'loai',['Tất cả','Yêu cầu đặt cọc','Hợp đồng'])));
  if(o.trangthai) f.push(fField('Trạng thái', Filt.sel(k,'tt',['Tất cả','Khởi tạo','Chờ duyệt','Đã duyệt','Từ chối'])));
  if(o.duan)      f.push(fField('Dự án', Filt.sel(k,'duan',['Tất cả'].concat(projectOptions()))));
  if(o.erp)       f.push(fField('Đồng bộ ERP', Filt.sel(k,'erp',['Tất cả','Đã đồng bộ','Chưa đồng bộ'])));
  if(o.dates!==false){ f.push(fField('Từ ngày', Filt.date(k,'from'))); f.push(fField('Đến ngày', Filt.date(k,'to'))); }
  const search=`<div style="display:flex;flex-direction:column;gap:5px"><label style="font-size:12.5px;color:transparent">.</label>
    <div style="display:flex;gap:10px;align-items:center">
      <button class="btn" style="background:var(--orange);color:#fff" onclick="Filt.paint('${k}')">Tìm kiếm</button>
      <span style="color:var(--orange);font-size:18px;cursor:pointer" title="Làm mới" onclick="Filt.reset('${k}')">⟳</span></div></div>`;
  return `<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:18px">${f.join('')}${search}<div style="flex:1"></div>${o.right||''}</div>`;
}
function emptyState(txt){return `<div style="text-align:center;color:#9aa3af;padding:90px 0;font-size:13.5px">${txt||'Không có dữ liệu'}</div>`;}

/* ---------- pager ---------- */
function pager(txt,total){return `<div class="pager"><select><option>20</option></select><span>${txt}</span><div class="spacer"></div><button class="pg">Trước</button><button class="pg cur">1</button>${total>1?'<button class="pg">2</button><span>...</span><button class="pg">'+total+'</button>':''}<button class="pg">Sau</button></div>`;}
function pagerN(txt,pages){
  const pg=[]; for(let i=1;i<=pages;i++) pg.push(`<button class="pg ${i===1?'cur':''}">${i}</button>`);
  return `<div class="pager"><select><option>20</option></select><span>${txt}</span><div class="spacer"></div><button class="pg">Trước</button>${pg.join('')}<button class="pg">Sau</button></div>`;
}
function statChip(label,n,color){return `<span style="font-weight:600">${label}: </span><span style="display:inline-block;min-width:22px;text-align:center;background:${color||'#eee'};border-radius:4px;padding:1px 7px;font-weight:700;margin-right:14px">${n}</span>`;}

/* ---------- định dạng tiền ---------- */
function fmtVN(num){ num=Math.round(+num||0); return num.toLocaleString("vi-VN"); }     // 10.430.945.472
function fmtMoney(num){ return fmtVN(num)+" đ"; }
function parseVN(s){ return +String(s).replace(/[^\d]/g,'')||0; }

/* ---------- badge trạng thái ---------- */
function stPill(t){
  const map={'Chờ ĐVBH xác nhận':'#FFF3D6;color:#a9820a','Giữ chỗ thành công':'#D6F0DD;color:#1f8a44',
    'Chuyển cọc thành công':'#D6F0DD;color:#1f8a44','Đã duyệt':'#E6F0FF;color:#1565d8',
    'Khởi tạo':'#E2F6E6;color:#1f9d3d','Chờ KT thu tiền':'#FFF3D6;color:#a9820a',
    'Chờ duyệt':'#FFF3D6;color:#a9820a','Đã thanh lý':'#ececec;color:#555','Từ chối':'#FBDADA;color:#c0392b'};
  const s=map[t]||'#eef0f3;color:#555';
  return `<span style="background:${s};padding:3px 9px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap">${t}</span>`;
}
/* pill theo key trạng thái sản phẩm */
function pPill(statusKey){ const d=CFG.PSTATUS[statusKey]||{label:statusKey,pill:'#eef0f3;color:#555'};
  return `<span style="background:${d.pill};padding:3px 9px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap">${d.label}</span>`; }
function pLabel(statusKey){ return (CFG.PSTATUS[statusKey]||{}).label || statusKey; }
function ycLabel(map,key){ return (CFG[map]||{})[key] || key; }

/* ---------- escape ---------- */
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ---------- dropdown menu + modal + toast ---------- */
function toggleMenu(e,id){ e.stopPropagation(); const m=document.getElementById(id); const wasHidden=m.classList.contains('hidden'); closeMenus(); if(wasHidden) m.classList.remove('hidden'); }
function closeMenus(){ document.querySelectorAll('.menu').forEach(m=>m.classList.add('hidden')); }
document.addEventListener('click',closeMenus);
function closeModal(){ document.getElementById('modalRoot').innerHTML=''; window._openProductMa=null; }
function toast(msg,kind){
  const bg = kind==='err' ? '#d0392b' : kind==='warn' ? '#d98a1f' : '#1f9d3d';
  const t=document.createElement('div'); t.textContent=msg;
  t.style.cssText=`position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:11px 20px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:90`;
  document.body.appendChild(t); setTimeout(()=>t.remove(),2300);
}
/* chạy 1 transition Workflow rồi thông báo + re-render */
function runWF(key, ma, data){
  const r = Workflow.run(key, ma, data);
  toast(r.msg, r.ok?'':'err');
  if(r.ok){ closeModal(); App.rerender(); }
  return r;
}

/* In chứng từ chung: mở cửa sổ in A4 (Times New Roman) với nội dung bodyHtml */
function printDoc(title, bodyHtml){
  const w=window.open('','_blank'); if(!w){ toast('Trình duyệt chặn cửa sổ in — cho phép pop-up','warn'); return; }
  const css="@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:'Times New Roman',serif;font-size:13pt;line-height:1.5;color:#000;max-width:190mm;margin:0 auto;padding:10px 12px 30px}"+
    "h1{font-size:15pt;text-align:center;margin:2px 0 2px;text-transform:uppercase}h2{font-size:13pt;margin:10px 0 4px}.muted{color:#444}.center{text-align:center}.right{text-align:right}"+
    ".kv{display:grid;grid-template-columns:210px 1fr;gap:8px;padding:3px 0;font-size:12.5pt}.kv b{font-weight:700}"+
    "table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #555;padding:5px 8px;text-align:left;font-size:11.5pt}th{background:#eee}"+
    ".sign{display:flex;justify-content:space-around;margin-top:34px;text-align:center;font-weight:700}"+
    ".bar{position:sticky;top:0;background:#1B7F3B;color:#fff;padding:8px 12px;margin:-10px -12px 14px;font-family:Arial,sans-serif;font-size:13px;display:flex;gap:12px;align-items:center}"+
    ".bar button{background:#fff;color:#1B7F3B;border:none;border-radius:6px;padding:5px 14px;font-weight:700;cursor:pointer}"+
    "@media print{.bar{display:none}body{padding-top:0}}";
  w.document.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>'+title+'</title><style>'+css+'</style></head><body>'+
    '<div class="bar"><button onclick="window.print()">🖨 In / Lưu PDF</button><span>'+title+'</span></div>'+bodyHtml+'</body></html>');
  w.document.close(); w.focus();
}
/* nhảy tới tab Hướng dẫn quy trình trong màn Quản lý bán hàng */
function gotoQuytrinh(){ try{ if(typeof go==='function') go('detail'); if(typeof setDTab==='function') setDTab('quytrinh'); }catch(e){} return false; }
