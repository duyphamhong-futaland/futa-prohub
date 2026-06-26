# FUTA Land — Prohub (web app)

Biến file `Prohub_Clone_UI_FUTA-Land_v3.html` (UI tĩnh, pixel-faithful của
`apps.futaland.vn`) thành **web app chạy thật**: giữ nguyên giao diện, bổ
sung tầng dữ liệu + state-machine nghiệp vụ của Prohub.

- **Stack:** HTML + CSS + Vanilla JS (SPA, không build tool), lưu `localStorage` (offline 100%).
- **Chạy:** phục vụ tĩnh tại **port 8098** → `http://localhost:8098/  (phục vụ tĩnh thư mục này)` (config `futa-prohub` trong `.claude/launch.json`).
- **Đăng nhập demo:** chọn 1 trong 6 tài khoản theo vai trò ở màn login (1 chạm). Ô email/mật khẩu để trống → vào bằng Admin.

## Kiến trúc (thư mục `js/`)

| File | Vai trò |
|------|---------|
| `config.js` | NAV, **PSTATUS** (state-machine sản phẩm + màu), trạng thái YCDCH/YCDCO/HĐ/PT, **ROLES** (RBAC), CRUMB, ROUTE_GROUP |
| `seed.js` | Dữ liệu demo chuẩn hoá (sản phẩm là "hub", KH/YCDCH/YCDCO/HĐ/phiếu thu tham chiếu cùng mã SP). Sinh lưới căn CT3/CT7 tự động |
| `store.js` | Kho trung tâm + persistence localStorage + session + query/mutation |
| `pricing.js` | **Engine cơ cấu giá** đúng công thức Excel: QSD đất → KPBT 2% → giá trị căn → VAT 10% → đợt thanh toán lũy kế; lãi phạt trễ hạn |
| `workflow.js` | **State-machine giao dịch**: publish → book → register → check → kdReview → confirmCoc → approvePayment → createHDMB; reclaim/liquidate. Mỗi bước tạo/cập nhật phiếu liên kết + ghi lịch sử |
| `rbac.js` | Phân quyền mềm: lọc menu, chặn route, khoá hành động, scope dữ liệu theo ĐVBH |
| `helpers.js` | Hàm render dùng chung (giữ markup gốc) + format tiền + badge trạng thái |
| `screens-*.js` | Màn hình: core (bảng hàng/YCDCH/YCDCO/giao dịch/dashboard/quy trình), policy, payments, contracts, misc |
| `app.js` | Bootstrap, login theo vai trò, sidebar, router, re-render sau mutation |

## "Logic khoa học" của Prohub đã wire (lát cắt lõi)

Vòng đời căn (state-machine, lan toả nhất quán mọi màn hình):

```
chua_mo_ban → mo_ban → giu_cho → dang_ky → kiem_tra → cho_duyet → da_coc → hop_dong
                 ↑ Công bố giá   ↑ Đặt chỗ   ↑ Đăng ký   ↑ Đủ HS    ↑ KD     ↑ KT xác   ↑ Tạo HĐMB
                                  (YCDCH)     (YCDCO)                 duyệt    nhận cọc
                                                                              → tạo HĐ cọc
                                                                              + đề nghị thu tiền
   nhánh: thu_hoi → mo_ban · thanh_ly
```

- **Hub-and-spoke:** 1 thay đổi trạng thái căn cập nhật đồng thời YCDCH, YCDCO, HĐ cọc, HĐMB, phiếu thu, dashboard, báo cáo.
- **RBAC 5 vai trò** (Admin·IT / Ban TGĐ / TPKD / Kế toán / Đại lý·ĐVBH): ẩn menu, chặn route, scope dữ liệu (đại lý chỉ thấy giao dịch ĐVBH mình).
- **Duyệt chính sách** (Khởi tạo → Trình duyệt → Duyệt/Từ chối), **duyệt phiếu thu**, **duyệt HĐ cọc**.
- **Cơ cấu giá + tiến độ thanh toán** tính tự động trong popup sản phẩm và chi tiết hợp đồng; **thống kê nợ lãi** tính lãi phạt từ engine.

## Đã bổ sung (đợt 2)
- **Upload tài liệu THẬT** ([uploader.js](js/uploader.js)): bấm/kéo-thả, ảnh nén + preview, lưu localStorage, có danh sách + xoá. Áp cho mọi ô "Upload tài liệu", ảnh CCCD (YCDCH), tài liệu hợp đồng.
- **(a) Hàng đợi ưu tiên + timeout tự trả** ([queue.js](js/queue.js)): nhiều claim tranh 1 căn → Ưu Tiên 1/2/3 (đếm ngược live), hết giờ tự trả + đẩy ưu tiên kế. Nút test "⏩ Hết giờ ngay" + chỉnh phút giữ.
- **(b) Supabase (tùy chọn)** ([sync.js](js/sync.js) + [supabase-config.js](js/supabase-config.js)): đồng bộ đa máy qua PostgREST (offline-first). Nút "🔌 Kết nối" (Admin) nhập URL+anon key, có SQL khởi tạo bảng. Để trống = chạy offline.
- **(c) Import bảng hàng thật** ([importer.js](js/importer.js)): tải nhập **.xlsx/.xls/.csv** (SheetJS nạp lười ở [vendor/](vendor/), CSV parse native), khớp theo tên cột, upsert theo Mã SP, báo cáo mới/cập nhật/lỗi. Tải về biểu mẫu + xuất bảng hàng (.xlsx/.csv).

## Bộ lọc THẬT ([filters.js](js/filters.js))
Trước đây các ô tìm kiếm/select/ngày chỉ trang trí. Nay engine `Filt` lọc thật, **giữ focus** khi gõ (chỉ vẽ lại `<div id="<key>-res">`, ô lọc nằm ngoài). Đã wire: Dự án (từ khoá + trạng thái), Khách hàng, TVV, Chủ đầu tư, Lịch sử tải nhập, Bàn giao, Chính sách TT/CK, CTBH (dự án+trạng thái+từ khoá), Đề nghị thu tiền + chờ duyệt + đã xử lý (từ khoá/loại/trạng thái/dự án/đồng-bộ-ERP/ngày), Hợp đồng cọc·MB·CN (từ khoá+trạng thái), Thống kê nợ lãi (từ khoá+CTBH+ngày), Báo cáo HĐ (từ khoá+trạng thái). **Bảng hàng**: ô tìm kiếm (làm mờ ô không khớp), lọc theo **trạng thái** + **ĐVBH** (multi-select) ngay trên lưới.

## Lưu vết & Hồ sơ cá nhân
- **Nhật ký thao tác (audit trail)**: mọi hành động ghi rõ **ai · vai trò · lúc nào · làm gì · đối tượng nào** (`Store.audit` + `pushHistory` tự ghi; login/duyệt phiếu/duyệt chính sách/duyệt HĐ ghi riêng). Xem ở **Hồ sơ → Lịch sử hoạt động**: Admin/Ban TGĐ/TPKD xem **mọi người dùng** (có toggle "Tất cả / Chỉ của tôi") + tìm kiếm; Kế toán/Đại lý chỉ xem **của mình**. Lịch sử từng căn (popup sản phẩm) cũng hiển thị người thực hiện.
- **Hồ sơ cá nhân** ([screens-profile.js](js/screens-profile.js), giống `apps.futaland.vn/profile`): thẻ trái (avatar, chức vụ-phòng ban, hạng/điểm) + menu (Thông tin tài khoản · Đổi mật khẩu · Mạng xã hội · Giới thiệu bạn bè · Lịch sử hoạt động). Hiển thị đúng **người đang đăng nhập** (CCCD, ngày/nơi cấp, SĐT, email, khu vực, chức vụ, phòng ban). Vào qua avatar → "Hồ sơ của tôi".

## QC end-to-end (đã test)
- **RBAC 2 lớp**: ngoài ẩn nút ở UI, mỗi transition trong `workflow.js` tự `deny(cap)` — gọi sai vai trò bị chặn tại tầng logic. Phân tách nhiệm vụ: Đại lý (đặt chỗ/đăng ký) → TPKD (kiểm tra/kiểm duyệt/tạo HĐMB) → Kế toán (xác nhận cọc/duyệt thu).
- Đã chạy **43 assertion tự động, 0 lỗi**: vòng đời đầy đủ theo đúng vai trò + ca âm (sai vai trò bị từ chối), 175 lượt render màn × 5 vai trò không lỗi, nav/route guard, lọc, audit, hàng đợi tự trả + đẩy ưu tiên.
- **Đã bỏ phần thừa** (không có trong Prohub thật): nút "⏩ Hết giờ (test)" + ô cấu hình phút trong popup; nút Quản lý SP/giá/Tải nhập trên Bảng hàng nay chỉ hiện với vai trò có quyền `ctbh.manage`.

## Hủy chỗ & hoàn tiền (3 cấp) + Chuyển nhượng — đã wire
- **Hoàn tiền 3 cấp**: Đại lý tạo đề nghị (`HT-xxxxxx`, cho_kd) → **KD/TPKD duyệt** (cho_kt) → **Kế toán chuyển tiền & xác nhận** (da_hoan) ⇒ thu hồi căn về kho + thanh lý HĐ cọc. Màn `refund-list` (Thanh toán) + `acc-refund` (Kế toán) hoạt động, nút theo quyền `refund.create / refund.approve.kd / refund.approve.kt`.
- **Chuyển nhượng**: từ popup căn (đã cọc/đã HĐ) → form khách mới → sinh **HĐCN** + **BBTL**, đổi chủ căn; hiện ở `hd-cn-list`. Quyền `contract.transfer` (TPKD/Admin).
- Test 16/16 PASS (gồm ca âm: Kế toán không tạo/không duyệt KD, TPKD không xác nhận KT, Đại lý/Kế toán không chuyển nhượng) + regression 195 lượt render.

## Đồng bộ ERP + Thông báo DxHome — đã wire ([screens-erp.js](js/screens-erp.js))
- **Đồng bộ ERP**: đẩy chứng từ tài chính (phiếu thu / hoàn tiền) sang ERP — gán **Mã chứng từ (BCO…)**, **định khoản (bút toán)** theo nghiệp vụ (cọc Nợ112/Có3387, thu HĐ Nợ112/Có131, doanh thu Nợ131/Có511+3331, hoàn Nợ3387/Có112). **Idempotent** (đã gán mã thì không đồng bộ lại), **nhật ký đồng bộ** (ai·lúc nào), **đối soát** (KPI đã/chờ/lỗi + giá trị), tab **Cấu hình ánh xạ**. Quyền `erp.sync` (Kế toán/Ban TGĐ/Admin).
- **Thông báo DxHome**: CMS soạn (tiêu đề/nội dung/đối tượng/lịch/banner) → gửi xuống app field (ĐVBH/khách), theo dõi lượt nhận; gửi đồng thời đẩy vào feed thông báo nội bộ. Quyền `dxhome` (TPKD/Ban TGĐ/Admin).
- Test 13/13 PASS (gồm idempotency + RBAC + audit). Regression: lifecycle + **205 lượt render (41 màn × 5 vai trò)**, 0 lỗi.

## Còn lại (wire dần)
- Supabase: nâng từ "1 dòng state JSONB" → per-record + **Auth/RLS** thật + upload file lên Storage; nối ERP/DxHome ra API thật (hiện mô phỏng endpoint).
- Gửi email phản hồi hồ sơ thật.
