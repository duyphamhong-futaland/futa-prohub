/* ============================================================
   FUTA Land — Prohub  ·  uploader.js
   Uploader THẬT (thay khung giả): bấm/kéo-thả chọn file → lưu vào Store
   (ảnh nén thành dataURL có preview, tệp nhỏ lưu dataURL để tải lại,
   tệp lớn lưu metadata). Mỗi vị trí upload dùng 1 "slot" để persist riêng.
   ============================================================ */
const Uploader = (function(){
  const _labels = {};
  const sid  = s => String(s).replace(/[^a-z0-9]/gi,'_');
  const esc  = s => String(s).replace(/['"\\]/g,'');
  const fmtSize = b => b<1024?b+' B' : b<1048576?(b/1024).toFixed(0)+' KB' : (b/1048576).toFixed(1)+' MB';

  function compressImage(file, cb){
    try{
      const img=new Image(), url=URL.createObjectURL(file);
      img.onload=()=>{ URL.revokeObjectURL(url);
        let w=img.width, h=img.height; const max=1100;
        if(w>max||h>max){ const r=Math.min(max/w, max/h); w=Math.round(w*r); h=Math.round(h*r); }
        const c=document.createElement('canvas'); c.width=w; c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        try{ cb(c.toDataURL('image/jpeg',0.72)); }catch(e){ cb(null); } };
      img.onerror=()=>{ URL.revokeObjectURL(url); cb(null); };
      img.src=url;
    }catch(e){ cb(null); }
  }
  function process(file, cb){
    const base={id:'f'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:file.name, size:file.size, type:file.type||''};
    if((file.type||'').indexOf('image/')===0){ compressImage(file, du=>cb(Object.assign(base,{dataUrl:du}))); }
    else if(file.size <= 1.2*1024*1024){ const fr=new FileReader(); fr.onload=()=>cb(Object.assign(base,{dataUrl:fr.result})); fr.onerror=()=>cb(base); fr.readAsDataURL(file); }
    else { cb(base); }   // tệp lớn: chỉ lưu metadata (không nhồi localStorage)
  }
  function add(slot, files){
    files=[...(files||[])]; if(!files.length) return;
    let pending=files.length;
    files.forEach(file=>process(file, rec=>{
      Store.addAttachment(slot, rec);
      if(--pending===0){ refresh(slot); toast(files.length+' tệp đã tải lên'); }
    }));
  }
  function pick(input, slot){ add(slot, input.files); input.value=''; }
  function drop(e, slot){ e.preventDefault(); const z=e.currentTarget; if(z) z.style.borderColor=''; add(slot, e.dataTransfer && e.dataTransfer.files); }
  function dover(e){ e.preventDefault(); if(e.currentTarget) e.currentTarget.style.borderColor='#1e74e0'; }
  function dleave(e){ if(e.currentTarget) e.currentTarget.style.borderColor=''; }
  function remove(slot, id){ Store.removeAttachment(slot, id); refresh(slot); }

  function fileRow(slot, f){
    const slotEsc=esc(slot);
    const thumb = (f.dataUrl && (f.type||'').indexOf('image/')===0)
      ? `<img src="${f.dataUrl}" style="width:34px;height:34px;border-radius:5px;object-fit:cover">`
      : `<span style="color:#8a93a0;font-size:18px">📄</span>`;
    const nameEl = f.dataUrl
      ? `<a href="${f.dataUrl}" download="${esc(f.name)}" style="flex:1;font-weight:600;line-height:1.3">${f.name}</a>`
      : `<span style="flex:1;font-weight:600;line-height:1.3">${f.name} <span class="hint" style="display:inline">(không lưu nội dung offline)</span></span>`;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #eef1f5">
      ${thumb}${nameEl}<span style="color:#9aa3af;font-size:11px;white-space:nowrap">${fmtSize(f.size)}</span>
      <span style="color:#b0b6c0;cursor:pointer;font-size:15px" title="Xoá" onclick="Uploader.remove('${slotEsc}','${f.id}')">✕</span></div>`;
  }
  function listHTML(slot){
    const list=Store.attachments(slot); if(!list.length) return '';
    return `<div style="border:1px solid var(--line);border-radius:8px;margin-top:12px">
      <div style="padding:9px 14px;border-bottom:1px solid var(--line);color:#3a4658;font-size:12.5px">Tệp đã tải lên (${list.length})</div>
      ${list.map(f=>fileRow(slot,f)).join('')}</div>`;
  }
  /* khung upload tài liệu (thay bigUpload) */
  function render(slot, opts){
    opts=opts||{}; const id=sid(slot), slotEsc=esc(slot);
    return `
     <div ondragover="Uploader.dover(event)" ondragleave="Uploader.dleave(event)" ondrop="Uploader.drop(event,'${slotEsc}')"
       onclick="document.getElementById('up-input-${id}').click()"
       style="border:1px dashed #c7cfdb;border-radius:8px;padding:30px;text-align:center;color:var(--blue2);margin:8px 0;cursor:pointer;transition:.12s">
       <div style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:38px;border:1.5px solid #9db4d8;border-radius:5px;color:#9db4d8;font-size:18px">＋</div>
       <div style="font-weight:600;margin-top:8px">${opts.title||'Upload tài liệu'}</div><div class="hint">${opts.sub||''}</div></div>
     <input id="up-input-${id}" type="file" multiple ${opts.accept?`accept="${opts.accept}"`:''} class="hidden" onchange="Uploader.pick(this,'${slotEsc}')">
     <div id="up-list-${id}">${listHTML(slot)}</div>`;
  }
  /* ô ảnh đơn có preview (CCCD...) */
  function imageInner(slot, label){
    const id=sid(slot), slotEsc=esc(slot);
    const list=Store.attachments(slot); const img=list.find(f=>f.dataUrl && (f.type||'').indexOf('image/')===0);
    const inner = img
      ? `<img src="${img.dataUrl}" style="width:100%;height:100%;object-fit:cover">
         <span onclick="event.stopPropagation();Uploader.remove('${slotEsc}','${img.id}')" style="position:absolute;top:5px;right:7px;background:rgba(0,0,0,.55);color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:12px">✕</span>`
      : `＋<div class="hint" style="text-align:center;padding:0 8px">Bấm/kéo-thả · Tối đa 5MB · .jpeg .jpg .png</div>`;
    return `<div style="font-size:12px;margin-bottom:6px">${label}</div>
      <div ondragover="Uploader.dover(event)" ondragleave="Uploader.dleave(event)" ondrop="Uploader.drop(event,'${slotEsc}')" onclick="document.getElementById('up-input-${id}').click()"
        style="border:1px dashed #c7cfdb;border-radius:8px;height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;overflow:hidden;position:relative">${inner}</div>
      <input id="up-input-${id}" type="file" accept="image/*" class="hidden" onchange="Uploader.pick(this,'${slotEsc}')">`;
  }
  function imageBox(slot, label){ _labels[slot]=label; return `<div style="flex:1" id="imgbox-${sid(slot)}">${imageInner(slot,label)}</div>`; }

  function refresh(slot){
    const id=sid(slot);
    const l=document.getElementById('up-list-'+id); if(l) l.innerHTML=listHTML(slot);
    const ib=document.getElementById('imgbox-'+id); if(ib) ib.innerHTML=imageInner(slot, _labels[slot]||'');
  }

  return { render, imageBox, imageInner, listHTML, add, pick, drop, dover, dleave, remove, refresh };
})();
