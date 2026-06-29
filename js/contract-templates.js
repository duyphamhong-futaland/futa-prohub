/* ============================================================
   FUTA Land — Prohub · contract-templates.js
   Cầu nối bộ template hợp đồng vào luồng giao dịch: auto-điền từ
   dữ liệu căn/khách rồi mở cửa sổ in.

   ĐA DỰ ÁN (project-aware):
     · C5B  — FUTA Kim Phát (nhà liền kề)     -> templates/c5b/
     · DNTS — Đà Nẵng Times Square / FUTA      -> templates/dnts/
              Residence (căn hộ CT3 & CT7)      KHỚP seed Prohub.
   Mỗi pack: manifest (nạp sẵn, nhẹ) + content (nạp LƯỜI lần in đầu).
   Chọn pack theo dự án của CĂN: mã/block CT3·CT7 -> DNTS, còn lại -> C5B.

   Giữ tên public `C5BTpl` để khỏi sửa callsite (screens-contracts.js).
   ============================================================ */
const C5BTpl = (function () {
  const VER = '26';

  /* các pack template */
  const PACKS = {
    c5b:  { tpls: () => window.C5B_TEMPLATES,  content: () => window.C5B_CONTENT,
            src: 'templates/c5b/content.js',  groupMap: { coc: 'coc', mb: 'hdmb', thanhly: 'thanhly' } },
    dnts: { tpls: () => window.DNTS_TEMPLATES, content: () => window.DNTS_CONTENT,
            src: 'templates/dnts/content.js', groupMap: { coc: 'coc', mb: 'hdmb', thanhly: null } },
  };

  /* CSS cửa sổ in (A4, Times New Roman) */
  const PRINT_CSS = `
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family:'Times New Roman', serif; font-size:13pt; line-height:1.5; color:#000;
           max-width:200mm; margin:0 auto; padding:16px 12px 40px; }
    p { margin:2px 0; text-align:justify; }
    h1,h2,h3,h4,h5,h6 { text-align:center; font-weight:bold; margin:8px 0 4px; }
    h2 { font-size:13.5pt; } h3,h4,h5,h6 { font-size:13pt; }
    strong { font-weight:bold; } em { font-style:italic; }
    .c5b-li  { margin:2px 0 2px 22px; }
    .c5b-li2 { margin:2px 0 2px 44px; }
    .c5b-num { margin:2px 0 2px 14px; }
    .c5b-num2{ margin:2px 0 2px 34px; }
    .c5b-fill{ display:inline-block; min-width:120px; border-bottom:1px dotted #777; }
    table.c5b-tbl { border-collapse:collapse; width:100%; margin:6px 0; }
    .c5b-tbl td, .c5b-tbl th { border:1px solid #555; padding:4px 7px; vertical-align:top; text-align:left; }
    .c5b-toolbar { position:sticky; top:0; background:#1B7F3B; color:#fff; padding:9px 14px; margin:-16px -12px 16px;
                   display:flex; gap:12px; align-items:center; flex-wrap:wrap; font-family:Arial, sans-serif; font-size:13px; }
    .c5b-toolbar select { padding:4px 8px; border-radius:6px; border:none; }
    .c5b-toolbar button { padding:5px 14px; border:none; border-radius:6px; background:#fff; color:#1B7F3B; font-weight:700; cursor:pointer; }
    @media print { .c5b-toolbar { display:none; } body { padding-top:0; } }
  `;

  /* danh sách template của 1 pack (gắn nhãn project nếu manifest C5B chưa có) */
  function all(project) {
    const p = PACKS[project] || PACKS.c5b;
    return (p.tpls() || []).map(t => t.project ? t : Object.assign({ project: project }, t));
  }
  function meta(project, id) { return all(project).find(t => t.id === id); }

  /* dự án của căn: mã/block CT3·CT7 -> DNTS, còn lại -> C5B */
  function projectOf(p, c) {
    const key = (p && (p.ma || p.block)) || (c && c.sp) || '';
    return /^\s*CT\s*[37]/i.test(key) ? 'dnts' : 'c5b';
  }

  /* nạp lười content.js của pack rồi gọi cb */
  function ensureContent(project, cb) {
    const pk = PACKS[project] || PACKS.c5b;
    if (pk.content()) return cb();
    const s = document.createElement('script');
    s.src = pk.src + '?v=' + VER;
    s.onload = () => cb();
    s.onerror = () => (typeof toast === 'function' ? toast('Lỗi nạp nội dung mẫu hợp đồng') : null);
    document.head.appendChild(s);
  }

  /* chọn template theo nhóm + đối tượng + phương thức + tháp (fallback dần) */
  function pick(project, group, buyerType, payment, tower) {
    const tw = (tower || '').toLowerCase();
    const list = all(project).filter(t => t.group === group);
    const byTower = tw ? list.filter(t => !t.tower || t.tower.toLowerCase() === tw) : list;
    const pool = byTower.length ? byTower : list;
    return pool.find(t => t.buyerType === buyerType && t.payment === payment)
        || pool.find(t => t.buyerType === buyerType && !t.payment)
        || pool.find(t => t.buyerType === buyerType)
        || pool[0] || null;
  }

  /* đoán đối tượng từ tên khách */
  function buyerTypeOf(name) {
    return /c[ôo]ng ty|cty|\bct\b|doanh nghi[ệe]p|tnhh|c[ổo] ph[ầa]n/i.test(name || '') ? 'cong_ty' : 'ca_nhan';
  }

  /* gom dữ liệu điền (superset cho cả C5B & DNTS) */
  function dataFrom(c, p, cust) {
    const fv = typeof fmtVN === 'function' ? fmtVN : (x => x);
    const khName = (c && c.kh) || (cust && cust.name) || (c && c.ten ? String(c.ten).split('-').slice(-1)[0] : '');
    const isCty = buyerTypeOf(khName) === 'cong_ty';
    const d = {
      so_hd: (c && c.so) || '', ngay_ky: (c && (c.ngayTao || c.ngay)) || '',
      so_hdmb: (c && c.so) || '',
      // căn — C5B keys
      ma_sp: (p && p.ma) || (c && c.sp) || '', block: (p && p.block) || '',
      dt_dat: p ? p.ttuy : '', dt_san: p ? (p.tim || p.ttuy) : '', so_tang: (p && p.so_tang) || '',
      gia_ban: p ? fv(p.giaVAT || p.giaCB) : '',
      // căn — DNTS keys (căn hộ chung cư)
      thap: (p && p.block) || '', tang: (p && p.tang) || '',
      dt_su_dung: p ? p.ttuy : '',
      // cọc / thanh lý
      so_hd_coc: (c && (c.hdCoc || c.phieuCoc)) || '', ngay_hd_coc: (c && c.ngayTao) || '',
      tien_coc: fv(100000000), tien_coc_chu: 'Một trăm triệu đồng',
      tien_hoan: fv(100000000),
    };
    if (cust) {
      d.ben_b_ten = cust.name || ''; d.ben_b_cccd = cust.cccd || '';
      d.ben_b_cccd_ngay = cust.ngayCap || ''; d.ben_b_cccd_noi = cust.noiCap || '';
      d.ben_b_cutru = cust.diaChi || ''; d.ben_b_diachi_lh = cust.diaChiLienHe || cust.diaChi || '';
      d.ben_b_dienthoai = cust.phone || ''; d.ben_b_email = cust.email || '';
      d.ben_b_congty = isCty ? khName : ''; d.ben_b_diachi = cust.diaChi || '';
      d.ben_b_daidien = cust.nguoiDaiDien || ''; d.ben_b_chucvu = cust.chucVu || '';
      d.ben_b_mst = cust.mst || ''; d.ben_b_dn_ngay = ''; d.ben_b_dn_noi = '';
    } else {
      d.ben_b_ten = isCty ? '' : khName; d.ben_b_congty = isCty ? khName : '';
    }
    return d;
  }

  /* thay {{key}} -> giá trị (rỗng -> ô fill) */
  function fill(html, data) {
    data = data || {};
    return html.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_, k) => {
      const v = data[k];
      return (v == null || v === '') ? '<span class="c5b-fill"></span>' : String(v);
    });
  }

  /* mở cửa sổ in: thanh chọn biến thể nhóm theo groupName (cả bộ của dự án) */
  function openPrint(project, id, data, group, note) {
    ensureContent(project, function () {
      const CONTENT = (PACKS[project] || PACKS.c5b).content();
      const html = CONTENT && CONTENT[id];
      if (!html) { typeof toast === 'function' && toast('Không tìm thấy mẫu ' + id); return; }
      const noteHtml = note ? `<span style="background:#fff;color:#1B7F3B;padding:3px 10px;border-radius:6px;font-weight:700">${note}</span>` : '';
      // gom optgroup theo groupName để mở được cả bộ văn bản của dự án
      const groups = {};
      all(project).forEach(t => { (groups[t.groupName] = groups[t.groupName] || []).push(t); });
      const opts = Object.keys(groups).map(gn =>
        `<optgroup label="${gn}">` +
        groups[gn].map(t => `<option value="${t.id}"${t.id === id ? ' selected' : ''}>${t.name}</option>`).join('') +
        `</optgroup>`).join('');
      const dataJson = JSON.stringify(data || {}).replace(/</g, '\\u003c');
      const contentJson = JSON.stringify(CONTENT).replace(/</g, '\\u003c');
      const w = window.open('', '_blank');
      w.document.write(
        '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' +
        (meta(project, id) ? meta(project, id).name : id) + '</title><style>' + PRINT_CSS + '</style></head><body>' +
        '<div class="c5b-toolbar">📑 Mẫu: <select id="c5bSel" onchange="c5bRender(this.value)">' + opts + '</select>' +
        '<button onclick="window.print()">🖨 In / Lưu PDF</button>' + noteHtml +
        '<span style="opacity:.85">Đã tự điền từ dữ liệu giao dịch — chỗ trống là ô điền tay.</span></div>' +
        '<div id="c5bDoc"></div>' +
        '<script>var C=' + contentJson + ',D=' + dataJson + ';' +
        'function c5bFill(h){return h.replace(/\\{\\{([a-z0-9_]+)\\}\\}/gi,function(_,k){var v=D[k];return (v==null||v==="")?\'<span class="c5b-fill"></span>\':String(v);});}' +
        'function c5bRender(id){document.getElementById("c5bDoc").innerHTML=c5bFill(C[id]||"");document.title=document.getElementById("c5bSel").selectedOptions[0].text;}' +
        'c5bRender(' + JSON.stringify(id) + ');<\/script>' +
        '</body></html>'
      );
      w.document.close(); w.focus();
    });
  }

  /* === API cho luồng giao dịch ===
     type: 'coc' | 'mb' | 'thanhly' ; so: số hợp đồng */
  function printContract(type, so) {
    const st = (typeof Store !== 'undefined') ? Store.get() : null;
    if (!st) return;
    const arr = type === 'mb' ? st.hdMB : st.hdCoc;
    const c = (arr || []).find(x => x.so === so) || (arr || [])[0];
    if (!c) { typeof toast === 'function' && toast('Không tìm thấy hợp đồng'); return; }
    const p = typeof Store.product === 'function' ? Store.product(c.sp) : null;
    const cust = (p && p.customerId && typeof Store.customer === 'function') ? Store.customer(p.customerId) : null;
    const khName = c.kh || (cust && cust.name) || (c.ten ? String(c.ten).split('-').slice(-1)[0] : '');
    const project = projectOf(p, c);
    const pk = PACKS[project] || PACKS.c5b;
    const group = pk.groupMap[type];
    if (!group) { typeof toast === 'function' && toast('Dự án ' + project.toUpperCase() + ' chưa có mẫu cho "' + type + '"'); return; }
    const tower = (p && p.block) || '';
    const tpl = pick(project, group, buyerTypeOf(khName), 'chuan', tower);
    if (!tpl) { typeof toast === 'function' && toast('Chưa có mẫu cho nhóm ' + group); return; }
    // Chính sách CK theo phương thức (chỉ C5B có bảng đối chứng POL.c5bDiscount)
    let note = '';
    if (project === 'c5b' && (group === 'hdmb' || group === 'coc') && typeof POL !== 'undefined' && POL.c5bDiscount) {
      const ck = POL.c5bDiscount(tpl.payment);
      const fv = typeof fmtVN === 'function' ? fmtVN : (x => x);
      const amt = ck.pct ? Math.round((p ? (p.giaCB || 0) : 0) * ck.pct) : 0;
      if (ck && ck.label) note = 'CS: ' + ck.label + (ck.pct ? ' · CK ' + (ck.pct * 100) + '% = ' + fv(amt) + 'đ' : ' · không CK');
    }
    openPrint(project, tpl.id, dataFrom(c, p, cust), group, note);
    typeof toast === 'function' && toast('Mở mẫu: ' + tpl.name);
  }

  return { all, meta, pick, fill, dataFrom, buyerTypeOf, projectOf, openPrint, printContract, ensureContent };
})();
