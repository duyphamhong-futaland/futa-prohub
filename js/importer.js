/* ============================================================
   FUTA Land — Prohub  ·  importer.js
   Tải nhập bảng hàng THẬT từ Excel (.xlsx/.xls) hoặc CSV.
   - .csv: parse native (offline, không phụ thuộc).
   - .xlsx: nạp lười thư viện SheetJS (vendor/xlsx.full.min.js).
   Map theo TÊN CỘT (linh hoạt), upsert vào kho sản phẩm theo Mã SP.
   ============================================================ */
const Importer = (function(){

  /* tên cột (đã chuẩn hoá) → field sản phẩm */
  const HMAP = {
    'mã sp':'ma','mã sản phẩm':'ma','ma':'ma','mã căn':'ma','mã bđs':'ma','ma sp':'ma','ma can':'ma',
    'block':'block','tháp':'block','khu':'block','block/khu':'block',
    'tầng':'tang','tang':'tang','floor':'tang',
    'lô':'lo','căn':'lo','lo':'lo','mã lô':'lo',
    'loại':'loai','loại sp':'loai','loại sản phẩm':'loai','loai':'loai',
    'dt thông thủy':'ttuy','diện tích thông thủy':'ttuy','thông thủy':'ttuy','dt thong thuy':'ttuy',
    'dt tim tường':'tim','tim tường':'tim','diện tích tim tường':'tim',
    'hướng':'huong','hướng ban công':'huong','huong':'huong',
    'hướng cửa':'cua','hướng cửa chính':'cua','cua':'cua',
    'giá chưa vat':'giaCB','giá trị căn bán':'giaCB','giá cb':'giaCB','giá chưa vat (cb)':'giaCB','gia chua vat':'giaCB',
    'đơn giá':'donGia','đơn giá thông thủy':'donGia','don gia':'donGia',
    'giá có vat':'giaVAT','giá vat':'giaVAT','giá bán có vat':'giaVAT','gia co vat':'giaVAT',
    'trạng thái':'status','trang thai':'status','status':'status',
    'đvbh':'dvbh','đơn vị bán hàng':'dvbh','dvbh':'dvbh',
    'công khai giá':'congKhaiGia','cho công khai giá':'congKhaiGia',
  };
  const FIELDS = ['ma','block','tang','lo','loai','ttuy','tim','huong','cua','giaCB','donGia','giaVAT','status','dvbh','congKhaiGia'];
  const HEADERS = ['Mã SP','Block','Tầng','Lô','Loại','DT thông thủy','DT tim tường','Hướng','Hướng cửa','Giá chưa VAT','Đơn giá','Giá có VAT','Trạng thái','ĐVBH','Công khai giá'];

  function norm(s){ return String(s==null?'':s).trim().toLowerCase().replace(/\s+/g,' '); }
  function statusKey(label){
    const l=norm(label); if(!l) return null;
    if(CFG.PSTATUS[l]) return l;                       // đã là key
    for(const k of CFG.PSTATUS_ORDER){ if(norm(CFG.PSTATUS[k].label)===l) return k; }
    return null;
  }

  /* ---- CSV parse (hỗ trợ , hoặc ; , dấu nháy, BOM) ---- */
  function parseCSV(text){
    text = text.replace(/^﻿/, '');
    const firstLine = text.slice(0, text.indexOf('\n')>=0?text.indexOf('\n'):text.length);
    const delim = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
    const rows=[]; let row=[], cell='', q=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(q){ if(c==='"'){ if(text[i+1]==='"'){ cell+='"'; i++; } else q=false; } else cell+=c; }
      else if(c==='"') q=true;
      else if(c===delim){ row.push(cell); cell=''; }
      else if(c==='\n'){ row.push(cell); rows.push(row); row=[]; cell=''; }
      else if(c==='\r'){ /* skip */ }
      else cell+=c;
    }
    if(cell.length||row.length){ row.push(cell); rows.push(row); }
    return rows.filter(r=>r.some(x=>String(x).trim()!==''));
  }

  /* mảng-2-chiều (aoa, dòng 0 = header) → mảng object theo field */
  function mapRows(aoa){
    if(!aoa.length) return [];
    const head = aoa[0].map(h=>HMAP[norm(h)]||null);
    const out=[];
    for(let i=1;i<aoa.length;i++){
      const obj={ _row:i+1 }; let any=false;
      aoa[i].forEach((v,j)=>{ const f=head[j]; if(f){ obj[f]=v; if(String(v).trim()!=='') any=true; } });
      if(any) out.push(obj);
    }
    return out;
  }

  /* upsert vào kho sản phẩm */
  function applyRows(rows){
    let ok=0, dup=0, err=0; const errors=[];
    Store.mutate(st=>{
      rows.forEach(r=>{
        const ma=String(r.ma==null?'':r.ma).trim();
        if(!ma){ err++; errors.push({row:r._row, ma:'', msg:'Thiếu Mã SP'}); return; }
        let p=st.products.find(x=>x.ma===ma); const isNew=!p;
        if(!p){ p={id:ma, ma, duAnId:'P1', ctbhId:'CTBH1', block:'', tang:'', lo:'', loai:'',
          ttuy:0, tim:0, huong:'', cua:'', giaCB:0, donGia:0, giaVAT:0, congKhaiGia:false,
          status:'chua_mo_ban', customerId:null, khName:'', tvv:'', dvbh:'', history:[], queue:[]}; st.products.push(p); }
        const setNum=(f,key)=>{ if(r[key]!=null&&String(r[key]).trim()!=='') p[f]=parseVN(r[key]); };
        const setFloat=(f,key)=>{ if(r[key]!=null&&String(r[key]).trim()!==''){ const n=parseFloat(String(r[key]).replace(/\./g,'').replace(',','.')); if(!isNaN(n)) p[f]=n; } };
        if(r.block) p.block=String(r.block).trim();
        if(r.tang!=null&&String(r.tang).trim()!=='') p.tang=String(r.tang).trim();
        if(r.lo!=null&&String(r.lo).trim()!=='') p.lo=String(r.lo).trim();
        if(r.loai) p.loai=String(r.loai).trim();
        setFloat('ttuy','ttuy'); setFloat('tim','tim');
        if(r.huong) p.huong=String(r.huong).trim();
        if(r.cua) p.cua=String(r.cua).trim();
        setNum('giaCB','giaCB'); setNum('donGia','donGia'); setNum('giaVAT','giaVAT');
        if(r.status){ const k=statusKey(r.status); if(k) p.status=k; else { errors.push({row:r._row, ma, msg:'Trạng thái không hợp lệ: '+r.status}); } }
        if(r.dvbh) p.dvbh=String(r.dvbh).trim();
        if(r.congKhaiGia!=null&&String(r.congKhaiGia).trim()!=='') p.congKhaiGia=/^(1|true|x|có|co|yes)$/i.test(String(r.congKhaiGia).trim());
        Store.pushHistory(p, isNew?'Tải nhập: tạo mới':'Tải nhập: cập nhật');
        isNew?ok++:dup++;
      });
      Store.notify(`Tải nhập bảng hàng: +${ok} mới, ${dup} cập nhật, ${err} lỗi`);
    });
    return {ok, dup, err, errors, total:rows.length};
  }

  /* ---- nạp lười SheetJS ---- */
  function ensureXLSX(cb){
    if(window.XLSX){ cb(); return; }
    const s=document.createElement('script'); s.src='vendor/xlsx.full.min.js?v=2';
    s.onload=()=>cb(); s.onerror=()=>toast('Không tải được thư viện .xlsx — hãy xuất CSV','err');
    document.head.appendChild(s);
  }
  function readFile(file, cb){
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(ext==='csv'||ext==='tsv'||ext==='txt'){
      const fr=new FileReader(); fr.onload=()=>cb(mapRows(parseCSV(fr.result))); fr.onerror=()=>toast('Lỗi đọc file','err'); fr.readAsText(file,'utf-8');
    } else {
      ensureXLSX(()=>{ const fr=new FileReader(); fr.onload=()=>{
        try{ const wb=XLSX.read(new Uint8Array(fr.result),{type:'array'});
          const ws=wb.Sheets[wb.SheetNames[0]];
          const aoa=XLSX.utils.sheet_to_json(ws,{header:1, raw:true, defval:''});
          cb(mapRows(aoa));
        }catch(e){ toast('Lỗi đọc Excel: '+e.message,'err'); } };
        fr.onerror=()=>toast('Lỗi đọc file','err'); fr.readAsArrayBuffer(file); });
    }
  }

  /* ---- xuất biểu mẫu / bảng hàng ---- */
  function productAoa(list){
    const rows=[HEADERS];
    list.forEach(p=>rows.push([p.ma,p.block,p.tang,p.lo,p.loai,p.ttuy,p.tim,p.huong,p.cua,p.giaCB,p.donGia,p.giaVAT,(CFG.PSTATUS[p.status]||{}).label||p.status,p.dvbh,p.congKhaiGia?1:0]));
    return rows;
  }
  function downloadCSV(filename, aoa){
    const csv='﻿'+aoa.map(r=>r.map(c=>{ const s=String(c==null?'':c); return /[",;\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }
  function downloadXLSX(filename, aoa, sheet){
    ensureXLSX(()=>{ const ws=XLSX.utils.aoa_to_sheet(aoa); const wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheet||'BangHang'); XLSX.writeFile(wb, filename); });
  }
  function template(fmt){
    const sample=[
      ['CT7-031.001','CT7','031','001','Studio','45.5','51','Đông','Đông','6000000000','131868000','6600000000','Đang mở bán','Đại lý A','1'],
      ['CT7-031.002','CT7','031','002','Căn 2PN','70.3','76.3','Tây Bắc','Tây','10000000000','142247000','11000000000','Chưa mở bán','','0'],
    ];
    const aoa=[HEADERS].concat(sample);
    if(fmt==='csv') downloadCSV('Template-BangHang.csv', aoa); else downloadXLSX('Template-BangHang.xlsx', aoa, 'Mau');
    toast('Đang tải biểu mẫu bảng hàng ('+(fmt||'xlsx')+')...');
  }
  function exportBangHang(fmt){
    const list=Store.products().filter(p=>p.ctbhId==='CTBH1');
    const aoa=productAoa(list);
    if(fmt==='csv') downloadCSV('BangHang-FutaCT007.csv', aoa); else downloadXLSX('BangHang-FutaCT007.xlsx', aoa, 'BangHang');
    toast('Đang xuất bảng hàng ('+list.length+' căn)...');
  }

  /* ---- modal Tải nhập (thật) ---- */
  let parsed=null;
  function openImport(){
    parsed=null;
    document.getElementById('modalRoot').innerHTML=`
    <div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="width:620px">
      <div class="modal-h"><b>Tải nhập bảng hàng</b><button class="x" onclick="closeModal()">×</button></div>
      <div class="modal-b">
        <div class="note-bar">Hỗ trợ <b>.xlsx / .xls / .csv</b>. Cột bắt buộc: <b>Mã SP</b>. Khớp theo tên cột (xem biểu mẫu).
          <a href="#" onclick="Importer.template('xlsx');return false">⬇ Tải biểu mẫu .xlsx</a> ·
          <a href="#" onclick="Importer.template('csv');return false">.csv</a></div>
        <div class="pinfo"><div class="k">Chương trình bán hàng</div><div class="v">Futa CT007</div></div>
        <div id="impDrop" ondragover="Uploader.dover(event)" ondragleave="Uploader.dleave(event)" ondrop="Importer.onDrop(event)"
          onclick="document.getElementById('impFile').click()"
          style="border:2px dashed #9db4d8;border-radius:10px;padding:34px;text-align:center;color:var(--blue2);cursor:pointer;margin:10px 0">
          <div style="font-size:30px">⬆</div><div style="font-weight:600;margin-top:6px">Kéo thả hoặc bấm để chọn file (.xlsx, .csv)</div>
          <div class="hint" id="impName">Chưa chọn file</div></div>
        <input id="impFile" type="file" accept=".xlsx,.xls,.csv,.tsv" class="hidden" onchange="Importer.onPick(this)">
        <div id="impResult"></div>
        <div class="modal-actions" style="justify-content:flex-end">
          <button class="btn btn-ghost" onclick="closeModal()">Đóng</button>
          <button class="btn btn-primary" id="impApply" disabled onclick="Importer.apply()">Tải lên</button>
        </div>
      </div></div></div>`;
  }
  function onPick(input){ if(input.files && input.files[0]) handleFile(input.files[0]); }
  function onDrop(e){ e.preventDefault(); const z=e.currentTarget; if(z) z.style.borderColor=''; const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]; if(f) handleFile(f); }
  function handleFile(file){
    document.getElementById('impName').textContent=file.name;
    readFile(file, rows=>{
      parsed=rows;
      const missing = !rows.length;
      const noMa = rows.length && rows.every(r=>!String(r.ma||'').trim());
      const res=document.getElementById('impResult');
      if(missing){ res.innerHTML=`<div style="color:#c0392b;padding:10px 0">Không đọc được dòng dữ liệu nào.</div>`; document.getElementById('impApply').disabled=true; return; }
      if(noMa){ res.innerHTML=`<div style="color:#c0392b;padding:10px 0">Không tìm thấy cột <b>Mã SP</b>. Kiểm tra tiêu đề cột (tải biểu mẫu).</div>`; document.getElementById('impApply').disabled=true; return; }
      res.innerHTML=`<div style="background:#eef4ff;border:1px solid #d4e2fb;border-radius:8px;padding:12px 14px;margin:6px 0"><b style="color:var(--blue2)">Đã đọc ${rows.length} dòng.</b> Bấm “Tải lên” để cập nhật bảng hàng.</div>`;
      document.getElementById('impApply').disabled=false;
    });
  }
  function apply(){
    if(!parsed||!parsed.length){ toast('Chưa có dữ liệu','warn'); return; }
    const r=applyRows(parsed);
    document.getElementById('modalRoot').innerHTML=`
    <div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="width:640px">
      <div class="modal-h"><b>Kết quả tải nhập</b><button class="x" onclick="closeModal()">×</button></div>
      <div class="modal-b">
        <div style="background:#eef4ff;border:1px solid #d4e2fb;border-radius:8px;padding:14px 16px;margin-bottom:14px">
          <b style="color:var(--blue2)">${r.total} dòng được xử lý, trong đó:</b>
          <div style="display:flex;gap:36px;margin-top:8px;font-size:13px">
            <span><b style="color:#1f9d3d">${r.ok}</b> tạo mới</span>
            <span><b style="color:#1565d8">${r.dup}</b> cập nhật</span>
            <span><b style="color:#e03131">${r.err}</b> lỗi</span></div></div>
        ${r.errors.length?`<div style="max-height:180px;overflow:auto;border:1px solid var(--line);border-radius:8px">
          <table class="tbl" style="box-shadow:none"><thead><tr><th>Dòng</th><th>Mã SP</th><th>Lỗi</th></tr></thead>
          <tbody>${r.errors.map(e=>`<tr><td>${e.row}</td><td>${e.ma}</td><td style="color:#c0392b">${e.msg}</td></tr>`).join('')}</tbody></table></div>`
          :'<div style="color:var(--muted);text-align:center;padding:14px">Không có lỗi.</div>'}
        <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal();App.rerender();toast('Tải nhập xong: +${r.ok} mới, ${r.dup} cập nhật')">Hoàn tất</button></div>
      </div></div></div>`;
  }

  return { openImport, onPick, onDrop, apply, template, exportBangHang, applyRows, parseCSV, mapRows };
})();
