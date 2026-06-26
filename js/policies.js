/* ============================================================
   FUTA Land — Prohub · policies.js
   Registry CHÍNH SÁCH BÁN HÀNG THẬT (đối chứng file Excel "Tổng hợp
   chính sách … đang triển khai", cập nhật 22/06/2026). Nguồn sự thật
   trong app cho 3 dự án đang triển khai: FUTA Residence (CT3&7),
   FUTA Kim Phát (C5B), FUTA Kim An (H&A).

   Dùng:
   - Màn "Chính sách đang áp dụng" (SCREENS['policy-active']).
   - C5BTpl tra cứu CK theo phương thức (Vay/Chuẩn/Nhanh) khi in HĐMB C5B.
   ============================================================ */
window.SCREENS = window.SCREENS || {};

const POL = (function () {
  const UPDATED = '22/06/2026';

  const PROJECTS = [
    {
      key: 'residence', name: 'FUTA Residence (CT3 & CT7) — Đà Nẵng Times Square',
      active: [
        ['CSBH 02/FUTA Residence/KH/04.2026', '15/04/2026', 'Ưu đãi gói dịch vụ quản lý + nội thất + chiết khấu',
          'Miễn phí 2 năm DVQL; tặng gói nội thất (Studio/1PN 100tr, 2PN 200tr — hoàn thiện ≤45 ngày); KH thân thiết 1%; Thanh toán Nhanh 95% → CK 10%; mua sỉ 2 căn 2% / từ 3 căn 4%; HTLS 12 tháng'],
        ['CSBS 01/ĐN Times square/KH/06.2026', '16/06/2026', 'Tri ân "KH giới thiệu KH"',
          'Studio/1PN (100tr) & Căn hộ 2PN (200tr)'],
        ['CSTN 02/ĐN Times square/ĐL/12.2025', '22/12/2025', 'Thưởng nóng Sale & Đại lý',
          'Sale: Studio/1PN/2PN & Shophouse 20tr · Penthouse 100tr · 2PN Ocean Panorama (mã 03,04) 300tr. Đại lý: Studio/1PN/2PN 10tr'],
        ['CSTN/FUTA Residence/ĐL/04.2026', '15/04/2026', 'Thưởng nóng Sale & Đại lý (cập nhật)',
          'Sale: Studio/1PN/2PN 40tr/giao dịch. Đại lý: 10tr/giao dịch'],
      ],
      expired: [
        ['CSBH 02/ĐN Times square/KH/11.2025', '01/11/2025', 'CK 10% đặc biệt (36 căn) — trước thuế & phí bảo trì'],
        ['CSBH 01/ĐN Times square/KH/11.2025', '01/11/2025', 'Miễn phí 2 năm DVQL'],
        ['CSBH 03/ĐN Times square/KH/11.2025', '01/11/2025', 'Nhóm gia đình: 2 căn 2% / 3+ căn 4%'],
      ],
    },
    {
      key: 'c5b', name: 'FUTA Kim Phát (C5B)',
      active: [
        ['CSBH 03/FUTA KIMPHAT/KH/06.2026', '18/06/2026', 'PTTT chuẩn (không vay NH) + Thanh toán nhanh',
          'Chuẩn: CK 3% trước VAT (TT 30% GTHĐ gồm VAT, đúng tiến độ đợt 1). Nhanh: CK 6% trước VAT (TT 50% GTHĐ đợt 1)'],
        ['CSBH 02/FUTA KIMPHAT/KH/03.2026', '25/03/2026', 'Mua sỉ · thân thiết · địa phương · nhanh · HTLS',
          'Mua sỉ 2 căn 1% / từ 3 căn 2%; KH thân thiết 1%; địa phương (Đà Nẵng) 1%; Thanh toán Nhanh 70% → CK 10%; HTLS 12 tháng'],
        ['CSTN 01/FUTA KIMPHAT/ĐL/06.2026', '18/06/2026', 'Thưởng nóng Sale & Đại lý',
          'Townhouse & Shophouse — Sale 40tr/giao dịch · Đại lý 10tr/giao dịch'],
        ['CSBS 02/FUTA KIMPHAT/KH/06.2026', '16/06/2026', 'Tri ân "KH giới thiệu KH"',
          'Townhouse (100tr) & Shophouse (200tr)'],
      ],
      expired: [
        ['CSBS 02/FUTA KIMPHAT/KH/04.2026', '25/03/2026', '⚠️ CK 5% cho KH VAY NH (TT đủ 20% GTHĐ trong 1 ngày); HTLS 18→12 tháng — ĐÃ HẾT HIỆU LỰC'],
        ['CSBH 01/FUTA KIMPHAT/KH/01.2026', '10/01/2026', 'Mua sỉ 1%/2%; Early Bird 1%; thân thiết 1%; Nhanh 70% 10%; HTLS 18 tháng'],
      ],
      // ngoại giao 5% (theo bảng tổng hợp)
      diplomatic: 0.05,
    },
    {
      key: 'kiman', name: 'FUTA Kim An (H&A)',
      active: [
        ['CSBH 03/FUTA Kim An/ĐL/04.2026', '01/04/2026', 'Chiết khấu CB-NV / Ngoại giao + hoa hồng môi giới',
          'CB-NV: CK 2% trước thuế (sp chuyển cọc thành công); KH Ngoại giao: CK 5% trước thuế. Hoa hồng môi giới 2% (sau ký HĐMB & TT đủ 20% đợt 2)'],
        ['CSBH 01/FUTA Kim An/KH/04.2026', '01/04/2026', 'Gói ưu đãi KH (DVQL, Early Bird, nhanh, mua sỉ, HTLS)',
          'Miễn phí 2 năm DVQL; Early Bird 1% (25/4–5/5); CK đặc biệt 1% (TT đủ đợt 1 ngày mở bán); thân thiết 1%; mua sỉ 2 căn 1% / 3+ căn 2%; Nhanh 50% 5% / 70% 7% / 95% 9%; HTLS 12 tháng'],
        ['CSBH 01/FUTA Kim An/KH/04.2026 (bs)', '15/04/2026', 'Chiết khấu đặc biệt + mua sỉ số lượng lớn',
          'CK 2% (TT đủ 20% trong ngày 25/04); mua sỉ 5–9 căn 5%; từ 10 căn 5%'],
      ],
      expired: [],
    },
  ];

  /* Bảng % chính sách "máy đọc được" (đối chứng file 22/06/2026) — công thức giá ăn theo đây.
     methods = phương thức thanh toán (CK trên giá trước VAT). muaSi = chiết khấu theo số căn. */
  const RATES = {
    residence: {
      methods: [{ key: 'thuong', label: 'Tiêu chuẩn', pct: 0 }, { key: 'nhanh95', label: 'Nhanh 95%', pct: 0.10 }],
      muaSi: [{ min: 3, pct: 0.04 }, { min: 2, pct: 0.02 }], thanThiet: 0.01, htls: '12 tháng',
    },
    c5b: {
      methods: [{ key: 'chuan', label: 'PTTT chuẩn (không vay)', pct: 0.03 }, { key: 'nhanh', label: 'Thanh toán nhanh', pct: 0.06 },
                { key: 'nhanh70', label: 'Nhanh 70%', pct: 0.10 }, { key: 'vay', label: 'Khách vay NH', pct: 0 }],
      muaSi: [{ min: 3, pct: 0.02 }, { min: 2, pct: 0.01 }], thanThiet: 0.01, diaPhuong: 0.01, ngoaiGiao: 0.05, htls: '12 tháng',
    },
    kiman: {
      methods: [{ key: 'thuong', label: 'Tiêu chuẩn', pct: 0 }, { key: 'nhanh50', label: 'Nhanh 50%', pct: 0.05 },
                { key: 'nhanh70', label: 'Nhanh 70%', pct: 0.07 }, { key: 'nhanh95', label: 'Nhanh 95%', pct: 0.09 }],
      muaSi: [{ min: 10, pct: 0.05 }, { min: 5, pct: 0.05 }, { min: 3, pct: 0.02 }, { min: 2, pct: 0.01 }],
      thanThiet: 0.01, ngoaiGiao: 0.05, htls: '12 tháng',
    },
  };

  function byKey(k) { return PROJECTS.find(p => p.key === k); }
  function byName(name) {
    if (!name) return null;
    const s = String(name).toLowerCase();
    if (/kim ph[áa]t|c5b/.test(s)) return byKey('c5b');
    if (/times square|residence|ct3|ct7/.test(s)) return byKey('residence');
    if (/kim an|h\s*&\s*a|h&a/.test(s)) return byKey('kiman');
    return null;
  }
  function rates(k) { return RATES[k] || null; }
  function methods(k) { return (RATES[k] || {}).methods || []; }
  function discount(k, methodKey) {
    return methods(k).find(m => m.key === methodKey) || { key: '', label: '', pct: 0 };
  }
  function muaSiPct(k, soCan) {
    const hit = ((RATES[k] || {}).muaSi || []).find(x => (soCan || 0) >= x.min);
    return hit ? hit.pct : 0;
  }

  /* CK theo phương thức cho C5B — phục vụ auto-điền HĐMB (giữ tương thích) */
  function c5bDiscount(method) {
    switch (method) {
      case 'chuan': return { pct: 0.03, label: 'PTTT chuẩn (không vay)', note: 'CK 3% trước VAT · TT 30% GTHĐ (gồm VAT) đúng tiến độ đợt 1' };
      case 'nhanh': return { pct: 0.06, label: 'Thanh toán nhanh', note: 'CK 6% trước VAT · TT 50% GTHĐ đợt 1 (hoặc Nhanh 70% → CK 10%)' };
      case 'vay': return { pct: 0, label: 'Khách vay ngân hàng', note: 'Không chiết khấu (CK 5% đã HẾT HIỆU LỰC 04.2026) · HTLS 12 tháng' };
      default: return { pct: 0, label: '', note: '' };
    }
  }

  return { UPDATED, PROJECTS, RATES, c5bDiscount, byKey, byName, rates, methods, discount, muaSiPct };
})();

/* ---- Màn "Chính sách đang áp dụng (đối chứng)" ---- */
(function () {
  function projRows(rows, expired) {
    if (!rows || !rows.length) return `<tr><td colspan="4" style="text-align:center;color:#9aa3af;padding:18px">— không có —</td></tr>`;
    return rows.map((r, i) => `<tr${expired ? ' style="opacity:.6"' : ''}>
      <td>${i + 1}</td>
      <td class="code" style="white-space:nowrap">${r[0]}</td>
      <td style="white-space:nowrap">${r[1] || ''}</td>
      <td><b>${r[2]}</b>${r[3] ? `<div style="color:#3a4658;margin-top:3px">${r[3]}</div>` : ''}</td></tr>`).join('');
  }
  function projCard(p) {
    return `<div class="card" style="margin-bottom:18px">
      <div class="section-title" style="display:flex;align-items:center;gap:10px">
        🧾 ${p.name}
        <span style="background:#E2F6E6;color:#1f9d3d;padding:2px 9px;border-radius:11px;font-size:11px;font-weight:700">${p.active.length} đang áp dụng</span>
      </div>
      <div style="overflow:auto"><table class="tbl"><thead><tr>
        <th style="width:34px">#</th><th>Mã chính sách</th><th>Ngày AD</th><th>Nội dung & giá trị ưu đãi</th></tr></thead>
        <tbody>${projRows(p.active)}</tbody></table></div>
      ${p.expired && p.expired.length ? `<details style="margin-top:10px"><summary style="cursor:pointer;color:#8a93a0;font-size:13px">Hết hiệu lực (${p.expired.length})</summary>
        <div style="overflow:auto;margin-top:8px"><table class="tbl"><tbody>${projRows(p.expired, true)}</tbody></table></div></details>` : ''}
    </div>`;
  }
  SCREENS['policy-active'] = () => `
    <div class="page-title">CHÍNH SÁCH BÁN HÀNG ĐANG ÁP DỤNG</div>
    <div style="background:#eaf2ff;border:1px solid #d8e6fb;border-radius:8px;padding:12px 16px;margin:6px 0 18px;font-size:13.5px;color:#2a3340">
      Đối chứng theo file <b>Tổng hợp chính sách các dự án đang triển khai</b> — cập nhật <b>${POL.UPDATED}</b>.
      Mức chiết khấu HĐMB C5B theo phương thức: <b>Chuẩn 3%</b> · <b>Nhanh 6%</b> (Nhanh 70% → 10%) · <b>Vay: không CK</b> (CK 5% đã hết hiệu lực), HTLS 12 tháng.
    </div>
    ${POL.PROJECTS.map(projCard).join('')}`;
})();
