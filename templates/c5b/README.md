# Bộ template hợp đồng C5B (FUTA Kim Phát)

18 biểu mẫu pháp lý của vòng đời bán hàng dự án **C5B — FUTA Kim Phát** (CĐT Phương Trang),
dùng **chung** cho 2 app trong monorepo:

- **Prohub** (`prohub/`) — auto-điền từ dữ liệu giao dịch (căn/khách) rồi in. Nạp lười `content.js` khi in.
- **Document Composer** (`documents/`) — phòng ban "Hợp đồng dự án C5B": điền form tay → xuất .doc/.pdf.
  Nạp qua `../prohub/templates/c5b/{manifest,content}.js`.

> 1 nguồn vật lý đặt **trong `prohub/`** để `sync-prohub.sh` deploy được bản standalone.

## File

| File | Nội dung |
|------|----------|
| `manifest.js` | `window.C5B_TEMPLATES` — metadata + `fields[]` mỗi mẫu (nhẹ ~21KB) |
| `content.js`  | `window.C5B_CONTENT` — HTML 18 mẫu (`{{placeholder}}` ở chỗ điền, ~950KB) |
| `README.md`   | tài liệu này |

**Cả 2 file là sinh tự động — KHÔNG sửa tay.** Sửa nội dung ở nguồn rồi build lại.

## 18 mẫu

| Nhóm (`group`) | Mẫu | Biến thể |
|---|---|---|
| `hdmb` | Hợp đồng mua bán | Cá nhân / Công ty / Đồng sở hữu × Vay / Chuẩn / Nhanh (+ bản Công ty đầy đủ) |
| `coc` | Hợp đồng đặt cọc | Cá nhân, Công ty |
| `thanhly` | Biên bản thanh lý HĐ cọc | Cá nhân, Công ty |
| `bangiao` | Biên bản bàn giao hồ sơ dự án | Cá nhân, Công ty |
| `baolanh` | Bảo lãnh ngân hàng | Đề nghị phát hành, Từ chối thực hiện |

## Build lại

Nguồn markdown: `tools/c5b-src/` (đã convert từ .docx gốc bằng MarkItDown — xem `tools/README.md`).
> ⚠️ `tools/c5b-src/` **gitignore** (chứa dữ liệu mẫu cá nhân: tên/CCCD/email). Giữ local, không đẩy GitHub.
> `manifest.js`/`content.js` sinh ra đã thay hết `{{placeholder}}` → sạch PII → commit bình thường.
> Mất nguồn? Tạo lại: `tools/to-md.sh "<thư mục .docx>"` rồi copy vào `tools/c5b-src/{HDMB,MauVB}/`.

```bash
python3 tools/c5b-build.py
```

Muốn đổi nội dung/biến: sửa file `.md` trong `tools/c5b-src/` (hoặc chỉnh `subs`/`fields` trong
`tools/c5b-build.py` để thêm `{{placeholder}}`) rồi chạy lại lệnh trên. Nhớ bump `?v=` trong
`prohub/index.html` để trình duyệt nạp bản mới.
