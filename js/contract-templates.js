/* ============================================================
   FUTA Land — Prohub · contract-templates.js
   Cầu nối bộ template hợp đồng C5B (prohub/templates/c5b/) vào luồng
   giao dịch: auto-điền từ dữ liệu căn/khách rồi mở cửa sổ in.

   - manifest.js (window.C5B_TEMPLATES) nạp sẵn ở index.html (nhẹ).
   - content.js (window.C5B_CONTENT, ~1MB) nạp LƯỜI ở lần in đầu tiên.
   Bộ template dùng CHUNG với Document Composer (documents/) — 1 nguồn.
   ============================================================ */
const C5BTpl = (function () {
  const VER = '15';

  /* CSS dùng cho cửa sổ in (A4, Times New Roman, chuẩn văn bản hành chính) */
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
    .c5b-toolbar { position:sticky; top:0; background:#0050D8; color:#fff; padding:9px 14px; margin:-16px -12px 16px;
                   display:flex; gap:12px; align-items:center; font-family:Arial, sans-serif; font-size:13px; }
    .c5b-toolbar select { padding:4px 8px; border-radius:6px; border:none; }
    .c5b-toolbar button { padding:5px 14px; border:none; border-radius:6px; background:#fff; color:#0050D8; font-weight:700; cursor:pointer; }
    @media print { .c5b-toolbar { display:none; } body { padding-top:0; } }
  `;

  function all() { return window.C5B_TEMPLATES || []; }
  function meta(id) { return all().find(t => t.id === id); }

  /* nạp lười content.js rồi gọi cb */
  function ensureContent(cb) {
    if (window.C5B_CONTENT) return cb();
    const s = document.createElement('script');
    s.src = 'templates/c5b/content.js?v=' + VER;
    s.onload = () => cb();
    s.onerror = () => (typeof toast === 'function' ? toast('Lỗi nạp nội dung mẫu hợp đồng') : null);
    document.head.appendChild(s);
  }

  /* chọn template theo nhóm + đối tượng + phương thức (fallback dần) */
  function pick(group, buyerType, payment) {
    const list = all().filter(t => t.group === group);
    return list.find(t => t.buyerType === buyerType && t.payment === payment)
        || list.find(t => t.buyerType === buyerType && !t.payment)
        || list.find(t => t.buyerType === buyerType)
        || list[0] || null;
  }

  /* đoán đối tượng từ tên khách */
  function buyerTypeOf(name) {
    return /c[ôo]ng ty|cty|\bct\b|doanh nghi[ệe]p|tnhh|c[ổo] ph[ầa]n/i.test(name || '') ? 'cong_ty' : 'ca_nhan';
  }

  /* gom dữ liệu điền từ hợp đồng + căn + khách */
  function dataFrom(c, p, cust) {
    const fv = typeof fmtVN === 'function' ? fmtVN : (x => x);
    const khName = (c && (c.kh)) || (cust && cust.name) || (c && c.ten ? String(c.ten).split('-').slice(-1)[0] : '');
    const d = {
      so_hd: c && c.so || '', ngay_ky: c && (c.ngayTao || c.ngay) || '',
      ma_sp: (p && p.ma) || (c && c.sp) || '',
      block: p && p.block || '', dt_dat: p ? p.ttuy : '', dt_san: p ? p.tim : '',
      gia_ban: p ? fv(p.giaVAT || p.giaCB) : '',
      so_hd_coc: c && (c.hdCoc || c.phieuCoc) || '', ngay_hd_coc: c && c.ngayTao || '',
      tien_coc: fv(100000000), tien_coc_chu: 'Một trăm triệu đồng',
      tien_hoan: fv(100000000), so_hdmb: c && c.so || '',
    };
    if (cust) {
      d.ben_b_ten = cust.name || ''; d.ben_b_cccd = cust.cccd || '';
      d.ben_b_cccd_ngay = cust.ngayCap || ''; d.ben_b_cccd_noi = cust.noiCap || '';
      d.ben_b_cutru = cust.diaChi || ''; d.ben_b_dienthoai = cust.phone || '';
      d.ben_b_email = cust.email || '';
      d.ben_b_congty = buyerTypeOf(khName) === 'cong_ty' ? khName : '';
      d.ben_b_daidien = ''; d.ben_b_diachi = cust.diaChi || ''; d.ben_b_mst = '';
    } else {
      d.ben_b_ten = khName;
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

  /* mở cửa sổ in cho 1 template + dữ liệu, kèm thanh chọn biến thể (không in ra) */
  function openPrint(id, data, group, note) {
    ensureContent(function () {
      const html = window.C5B_CONTENT[id];
      if (!html) { typeof toast === 'function' && toast('Không tìm thấy mẫu ' + id); return; }
      const noteHtml = note ? `<span style="background:#fff;color:#0050D8;padding:3px 10px;border-radius:6px;font-weight:700">${note}</span>` : '';
      const opts = all().filter(t => !group || t.group === group)
        .map(t => `<option value="${t.id}"${t.id === id ? ' selected' : ''}>${t.name}</option>`).join('');
      const dataJson = JSON.stringify(data || {}).replace(/</g, '\\u003c');
      const contentJson = JSON.stringify(window.C5B_CONTENT).replace(/</g, '\\u003c');
      const w = window.open('', '_blank');
      w.document.write(
        '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' +
        (meta(id) ? meta(id).name : id) + '</title><style>' + PRINT_CSS + '</style></head><body>' +
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

  /* === API cho luồng giao dịch === */
  // type: 'coc' | 'mb' | 'thanhly' ; so: số hợp đồng
  function printContract(type, so) {
    const st = (typeof Store !== 'undefined') ? Store.get() : null;
    if (!st) return;
    const groupMap = { coc: 'coc', mb: 'hdmb', thanhly: 'thanhly' };
    const arr = type === 'mb' ? st.hdMB : st.hdCoc;
    const c = (arr || []).find(x => x.so === so) || (arr || [])[0];
    if (!c) { typeof toast === 'function' && toast('Không tìm thấy hợp đồng'); return; }
    const p = typeof Store.product === 'function' ? Store.product(c.sp) : null;
    const cust = (p && p.customerId && typeof Store.customer === 'function') ? Store.customer(p.customerId) : null;
    const khName = c.kh || (cust && cust.name) || (c.ten ? String(c.ten).split('-').slice(-1)[0] : '');
    const group = groupMap[type] || 'hdmb';
    const tpl = pick(group, buyerTypeOf(khName), 'chuan');
    if (!tpl) { typeof toast === 'function' && toast('Chưa có mẫu cho nhóm ' + group); return; }
    // Chính sách C5B áp dụng theo phương thức (Vay/Chuẩn/Nhanh) — đối chứng file CS 22/06/2026
    let note = '';
    if ((group === 'hdmb' || group === 'coc') && typeof POL !== 'undefined') {
      const ck = POL.c5bDiscount(tpl.payment);
      const fv = typeof fmtVN === 'function' ? fmtVN : (x => x);
      const amt = ck.pct ? Math.round((p ? (p.giaCB || 0) : 0) * ck.pct) : 0;
      if (ck && ck.label) note = 'CS: ' + ck.label + (ck.pct ? ' · CK ' + (ck.pct * 100) + '% = ' + fv(amt) + 'đ' : ' · không CK');
    }
    openPrint(tpl.id, dataFrom(c, p, cust), group, note);
    typeof toast === 'function' && toast('Mở mẫu: ' + tpl.name);
  }

  return { all, meta, pick, fill, dataFrom, buyerTypeOf, openPrint, printContract, ensureContent };
})();
