# Bộ template hợp đồng DNTS — Đà Nẵng Times Square / FUTA Residence

28 biểu mẫu pháp lý của vòng đời bán hàng dự án **Tháp CT3 & CT7 — Đà Nẵng Times Square**
(tên thương mại *FUTA Residence*, CĐT Công ty CP Kim Long Nam). Đây là dự án **CĂN HỘ CHUNG CƯ**
— **khớp với seed Prohub** (căn CT3/CT7), khác bộ `c5b/` (FUTA Kim Phát, nhà liền kề).

Dùng **chung** cho 2 app trong monorepo:

- **Prohub** (`prohub/`) — auto-điền từ dữ liệu giao dịch (căn/khách) rồi in. Nạp lười `content.js` khi in.
  `contract-templates.js` chọn pack theo dự án của căn: mã/block **CT3·CT7 → DNTS**, còn lại → C5B.
- **Document Composer** (`documents/`) — phòng ban "Hợp đồng dự án ĐN Times Square": điền form tay → xuất.
  Nạp qua `../prohub/templates/dnts/{manifest,content}.js` + `documents/js/templates-dnts.js`.

> 1 nguồn vật lý đặt **trong `prohub/`** để `sync-prohub.sh` deploy được bản standalone.

## File

| File | Nội dung |
|------|----------|
| `manifest.js` | `window.DNTS_TEMPLATES` — metadata + `fields[]` mỗi mẫu (nhẹ ~43KB) |
| `content.js`  | `window.DNTS_CONTENT` — HTML các mẫu (`{{placeholder}}` ở chỗ điền, ~1.5MB) |
| `README.md`   | tài liệu này |

**Cả 2 file sinh tự động — KHÔNG sửa tay.** Sửa nội dung ở nguồn rồi build lại.

## 28 mẫu

| Nhóm (`group`) | Mẫu | Biến thể |
|---|---|---|
| `hdmb` | Hợp đồng mua bán căn hộ | CT3/CT7 × Cá nhân/Công ty × Chuẩn/Nhanh/Vay (12) |
| `coc` | Hợp đồng đặt cọc | Cá nhân, Công ty |
| `bg_canho` | BB bàn giao căn hộ (chính thức) | Cá nhân, Công ty |
| `bg_canho_tt` | BB bàn giao căn hộ (tạm thời) | Cá nhân, Công ty |
| `bg_hoso` | BB bàn giao hồ sơ dự án | Cá nhân, Công ty |
| `gn_hoso` | BB giao nhận hồ sơ | Cá nhân, Công ty |
| `pl_gia` | Phụ lục điều chỉnh giá & thời hạn TT | Cá nhân, Công ty |
| `pl_tk` | Phụ lục điều chỉnh số tài khoản | Cá nhân, Công ty |
| `baolanh` | Bảo lãnh ngân hàng | Đề nghị phát hành, Từ chối thực hiện |

Mỗi mẫu gắn `project:"dnts"`, `tower:"ct3"|"ct7"`, `buyerType`, `payment` để `pick()` chọn đúng theo căn.

## Phân bổ trường (`fields`)

- **F_DOC**: `so_hd`, `ngay_ky`
- **Căn hộ**: `ma_sp`, `thap` (CT3/CT7), `tang`, `dt_su_dung` (thông thủy), `dt_san` (tim tường), `gia_ban`
- **Bên Mua cá nhân**: `ben_b_ten`, `ben_b_cccd(+_ngay/_noi)`, `ben_b_cutru`, `ben_b_diachi_lh`, `ben_b_dienthoai`, `ben_b_email`
- **Bên Mua công ty**: `ben_b_congty`, `ben_b_mst`, `ben_b_dn_ngay/_noi`, `ben_b_daidien`, `ben_b_chucvu`, `ben_b_cccd(+…)`, `ben_b_diachi`, …
- **Cọc**: `tien_coc`, `tien_coc_chu` · **Bảo lãnh**: `so_hdmb`

`manifest.fields[]` chỉ giữ trường THỰC SỰ xuất hiện trong mẫu (lọc theo `{{placeholder}}` còn lại sau build).

## Build lại

Nguồn markdown: `tools/dnts-src/` (convert từ .docx gốc bằng MarkItDown).
> ⚠️ `tools/dnts-src/` **gitignore** (chứa PII mẫu: tên/CCCD/email/SĐT). Giữ local, không đẩy GitHub.
> `manifest.js`/`content.js` sinh ra đã thay hết `{{placeholder}}` → sạch PII → commit bình thường.
> Mất nguồn? Giải nén lại từ "1. Đà Nẵng Times Square.rar" → `tools/to-md.sh` → copy vào `tools/dnts-src/`.

```bash
python3 tools/dnts-build.py
```

Nhớ bump `?v=` trong `prohub/index.html` để trình duyệt nạp bản mới.
