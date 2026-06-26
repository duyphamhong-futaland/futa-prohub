/* ============================================================
   FUTA Land — Prohub  ·  config.js
   Hằng số nghiệp vụ: điều hướng, vai trò (RBAC), state-machine sản phẩm,
   trạng thái yêu cầu / hợp đồng / phiếu thu.  Mọi "logic khoa học" của
   Prohub bắt nguồn từ các định nghĩa ở file này.
   ============================================================ */
const CFG = {};

/* -------- Navigation model (left sidebar) — giữ nguyên như bản gốc -------- */
CFG.NAV = [
  {ico:"👥", label:"Khách hàng", key:"customers", cap:"customers"},
  {ico:"🏢", label:"Dự án", key:"projects", cap:"projects.view", children:[
     {label:"Danh sách dự án", key:"projects"},
     {label:"Danh sách chủ đầu tư", key:"investors"},
     {label:"Lịch sử tải nhập", key:"importlog"},
     {label:"Chương trình bán hàng", key:"ctbh-list"},
  ]},
  {ico:"🧾", label:"Chính sách bán hàng", key:"policy", cap:"policy.view", children:[
     {label:"Chính sách thanh toán", key:"pay-list"},
     {label:"Chính sách chiết khấu", key:"disc-list"},
     {label:"Lịch sử tải nhập", key:"importlog"},
  ]},
  {ico:"💳", label:"Thanh toán", key:"payments", cap:"payment.view", children:[
     {label:"Đề nghị thu tiền", key:"req-create"},
     {label:"Danh sách đề nghị thu tiền", key:"req-list"},
     {label:"Danh sách đề nghị hoàn tiền", key:"refund-list"},
  ]},
  {ico:"📊", label:"Kế toán", key:"accounting", cap:"accounting.view", children:[
     {label:"Phiếu thu", key:"receipt"},
     {label:"Đề nghị thu tiền chờ duyệt", key:"req-pending"},
     {label:"Đề nghị thu tiền đã xử lý", key:"req-done"},
     {label:"Chuyển khoản chờ xác nhận", key:"transfer-wait"},
     {label:"Phiếu chi", key:"voucher-chi"},
     {label:"Danh sách đề nghị hoàn tiền", key:"acc-refund"},
  ]},
  {ico:"📈", label:"Báo cáo", key:"reports", cap:"reports"},
  {ico:"🔑", label:"Quản lý phân quyền người dùng", key:"rbac", cap:"rbac"},
  {ico:"👤", label:"Danh sách TVV", key:"tvv", cap:"tvv"},
  {ico:"📑", label:"Hợp đồng", key:"contracts", cap:"contract.view", children:[
     {label:"Hợp đồng cọc", key:"hd-coc-list"},
     {label:"Hợp đồng mua bán/ Thuê", key:"hd-mb-list"},
     {label:"Hợp đồng chuyển nhượng", key:"hd-cn-list"},
     {label:"Lịch sử tải nhập", key:"hd-importlog"},
     {label:"Thống kê nợ lãi", key:"hd-no-lai"},
     {label:"Báo cáo hợp đồng dự án", key:"hd-baocao"},
  ]},
  {ico:"📕", label:"Thanh lý", key:"liquidation", cap:"liquidation", children:[
     {label:"Đơn đề nghị", key:"liq-form"},
  ]},
  {ico:"🚚", label:"Bàn giao", key:"handover", cap:"handover"},
  {ico:"🔗", label:"Đồng bộ ERP", key:"erp-sync", cap:"erp.sync"},
  {ico:"📣", label:"Thông báo DxHome", key:"dxhome", cap:"dxhome"},
];

/* ============================================================
   STATE MACHINE SẢN PHẨM (căn) — trái tim của Prohub.
   Mỗi căn đi qua vòng đời:
   chua_mo_ban → mo_ban → giu_cho → dat_cho → dang_ky
     → kiem_tra → cho_duyet → da_coc → hop_dong → ban_giao
   Nhánh phụ: dvbh_khac (đơn vị khác giữ), thu_hoi → mo_ban, thanh_ly.
   Mỗi trạng thái: nhãn + màu lưới (bảng màu gốc) + màu chữ.
   ============================================================ */
CFG.PSTATUS = {
  chua_mo_ban:{label:"Chưa mở bán",            grid:"#FFFFFF", dark:false, pill:"#eef0f3;color:#555"},
  mo_ban:     {label:"Đang mở bán",            grid:"#B6F0C6", dark:false, pill:"#E2F6E6;color:#1f9d3d"},
  giu_cho:    {label:"Giữ chỗ",                grid:"#FAE0A0", dark:false, pill:"#FFF3D6;color:#c98a00"},
  dat_cho:    {label:"Đặt chỗ",                grid:"#A6D8F2", dark:false, pill:"#E6F4FF;color:#1565d8"},
  dvbh_khac:  {label:"ĐVBH khác đang giữ",     grid:"#7B4FD0", dark:true,  pill:"#EDE3FB;color:#6b34c9"},
  dang_ky:    {label:"Đăng ký giao dịch",      grid:"#F08A3C", dark:true,  pill:"#FFE6C7;color:#b5640f"},
  kiem_tra:   {label:"Đang kiểm tra hồ sơ",    grid:"#F0C040", dark:false, pill:"#FFF3D6;color:#a9820a"},
  cho_duyet:  {label:"KD kiểm duyệt",          grid:"#F0524E", dark:true,  pill:"#FBDADA;color:#c0392b"},
  da_coc:     {label:"Chuyển cọc thành công",  grid:"#5FD15F", dark:true,  pill:"#D6F0DD;color:#1f8a44"},
  hop_dong:   {label:"Đã lên hợp đồng",        grid:"#D0258E", dark:true,  pill:"#FBE0EE;color:#c01b7a"},
  thanh_ly:   {label:"Đã thanh lý",            grid:"#9E9E9E", dark:true,  pill:"#ececec;color:#555"},
};
/* Thứ tự hiển thị legend + bảng màu gốc (giữ swatch như v3) */
CFG.PSTATUS_ORDER = ["chua_mo_ban","mo_ban","giu_cho","dat_cho","dvbh_khac","dang_ky","kiem_tra","cho_duyet","da_coc","hop_dong","thanh_ly"];

/* Trạng thái phiếu YCDCH (đặt chỗ) */
CFG.YCDCH_ST = {
  cho_xn:    "Chờ ĐVBH xác nhận",
  giu_cho:   "Giữ chỗ thành công",
  da_rap:    "Đã ráp ưu tiên",
  huy:       "Đề nghị hủy giữ chỗ",
  da_hoan:   "Đã hoàn hủy chỗ",
};
/* Trạng thái phiếu YCDCO (đặt cọc) */
CFG.YCDCO_ST = {
  cho_kt:    "ĐVBH xác nhận, chờ KT xác nhận tiền",
  xac_coc:   "Xác nhận cọc, chờ bổ sung tiền và hồ sơ",
  da_coc:    "Chuyển cọc thành công",
  kd_duyet:  "KD kiểm duyệt",
  tu_choi:   "Bị từ chối",
};
/* Trạng thái hợp đồng */
CFG.HD_ST = { khoi_tao:"Khởi tạo", cho_kt:"Chờ KT thu tiền", da_duyet:"Đã duyệt", thanh_ly:"Đã thanh lý" };
/* Trạng thái phiếu thu / đề nghị thu tiền */
CFG.PT_ST = { khoi_tao:"Khởi tạo", cho_duyet:"Chờ duyệt", da_duyet:"Đã duyệt", tu_choi:"Từ chối" };
/* Trạng thái chính sách */
CFG.CS_ST = { khoi_tao:"Khởi tạo", cho_duyet:"Chờ duyệt", duyet:"Đã duyệt", tu_choi:"Từ chối" };
/* Trạng thái đề nghị hoàn tiền (3 cấp: ĐL tạo → KD duyệt → KT hoàn) */
CFG.REFUND_ST = { cho_kd:"Chờ KD duyệt", cho_kt:"KD đã duyệt · chờ KT hoàn tiền", da_hoan:"Đã hoàn tiền", tu_choi:"Từ chối" };

/* ============================================================
   RBAC — 5 nhóm vai trò (đúng ma trận PHUONG-AN-TRIEN-KHAI)
   ============================================================ */
CFG.ROLES = {
  admin:  {name:"Admin · IT",   short:"Quản trị hệ thống", caps:"*"},
  bgd:    {name:"Ban TGĐ",      short:"Duyệt chính sách",
    caps:["customers","projects.view","policy.view","policy.create","policy.approve",
          "payment.view","accounting.view","contract.view","reports","tvv","liquidation","handover","erp.sync","dxhome"]},
  tpkd:   {name:"TPKD",         short:"Trưởng phòng KD",
    caps:["customers","projects.view","ctbh.manage","price.publish","policy.view","policy.create",
          "payment.view","booking","contract.view","contract.manage","accounting.view",
          "refund.create","refund.approve.kd","contract.transfer","reports","tvv","liquidation","handover","dxhome"]},
  ketoan: {name:"Kế toán",      short:"Kế toán",
    caps:["projects.view","policy.view","payment.view","accounting.view","accounting.approve",
          "refund.approve.kt","contract.view","reports","erp.sync"]},
  dvbh:   {name:"Đại lý · ĐVBH",short:"Đơn vị bán hàng",
    caps:["customers","projects.view","policy.view","booking","payment.view","refund.create","reports.own"]},
};

/* Tài khoản demo (đăng nhập 1 chạm) — kèm hồ sơ cá nhân */
CFG.DEMO_USERS = [
  {id:"u_admin", name:"Trần Nguyễn Huy",   role:"admin",  email:"huy.tn@futaland.vn",   dvbh:null,        ini:"TH",
    sdt:"0905112233", cccd:"048093001122", ngayCap:"12/03/2021", noiCap:"Cục CS QLHC về TTXH", mst:"",
    khuVuc:"Q. Hải Châu, Tp. Đà Nẵng", chucVu:"Quản trị hệ thống", phongBan:"Ban CNTT", rank:"NEW - L.0", points:0},
  {id:"u_bgd",   name:"Nguyễn Văn Đức",     role:"bgd",    email:"duc.nv@futaland.vn",   dvbh:null,        ini:"NĐ",
    sdt:"0905223344", cccd:"048088002233", ngayCap:"05/06/2020", noiCap:"Cục CS QLHC về TTXH", mst:"",
    khuVuc:"Q. Hải Châu, Tp. Đà Nẵng", chucVu:"Phó Tổng Giám đốc", phongBan:"Ban Tổng Giám đốc", rank:"GOLD - L.4", points:1280},
  {id:"u_tpkd",  name:"Mai Văn Trí",        role:"tpkd",   email:"tri.mv@futaland.vn",   dvbh:null,        ini:"MT",
    sdt:"0905334455", cccd:"048090003344", ngayCap:"18/09/2021", noiCap:"Cục CS QLHC về TTXH", mst:"",
    khuVuc:"Q. Hải Châu, Tp. Đà Nẵng", chucVu:"Trưởng phòng Kinh doanh", phongBan:"Phòng Kinh doanh", rank:"SILVER - L.2", points:420},
  {id:"u_kt",    name:"Đặng Hữu Dự",        role:"ketoan", email:"du.dh@futaland.vn",    dvbh:null,        ini:"ĐD",
    sdt:"0905445566", cccd:"048091004455", ngayCap:"22/01/2022", noiCap:"Cục CS QLHC về TTXH", mst:"",
    khuVuc:"Q. Hải Châu, Tp. Đà Nẵng", chucVu:"Kế toán", phongBan:"Phòng Kế toán", rank:"BRONZE - L.1", points:90},
  {id:"u_dl_a",  name:"Lê Anh Minh",        role:"dvbh",   email:"minh.la@daily-a.vn",   dvbh:"Đại lý A",  ini:"LM",
    sdt:"0905556677", cccd:"048095005566", ngayCap:"03/04/2023", noiCap:"Cục CS QLHC về TTXH", mst:"",
    khuVuc:"Q. Sơn Trà, Tp. Đà Nẵng", chucVu:"Tư vấn viên", phongBan:"Đại lý A", rank:"NEW - L.0", points:30},
  {id:"u_dl_c",  name:"Nguyễn Hoàng Long",  role:"dvbh",   email:"long.nh@daily-c.vn",   dvbh:"Đại lý C",  ini:"NL",
    sdt:"0905667788", cccd:"048096006677", ngayCap:"15/07/2023", noiCap:"Cục CS QLHC về TTXH", mst:"",
    khuVuc:"Q. Cẩm Lệ, Tp. Đà Nẵng", chucVu:"Tư vấn viên", phongBan:"Đại lý C", rank:"NEW - L.0", points:10},
];

/* -------- Router crumb + group (giữ nguyên như v3) -------- */
CFG.CRUMB = {
  projects:"🏠 Dự án", investors:"🏠 Dự án / Danh sách chủ đầu tư", importlog:"🏠 Dự án / Lịch sử tải nhập",
  detail:"🏠 Dự án / Quản lý bán hàng",
  "pay-list":"🏠 Chính sách bán hàng / Chính sách thanh toán","pay-form":"🏠 Chính sách bán hàng / Tạo mới chính sách thanh toán",
  "disc-list":"🏠 Chính sách bán hàng / Chính sách chiết khấu","disc-form":"🏠 Chính sách bán hàng / Tạo mới chính sách chiết khấu",
  "liq-form":"🏠 Thanh lý / Đơn đề nghị", "project-form":"🏠 Dự án / Tạo mới dự án",
  "ctbh-list":"🏠 Dự án / Chương trình bán hàng", "ctbh":"🏠 Dự án / Chỉnh sửa chương trình bán hàng",
  "pay-detail":"🏠 Chính sách bán hàng / Chính sách thanh toán",
  "disc-detail":"🏠 Chính sách bán hàng / Chính sách chiết khấu",
  "req-create":"🏠 Đề nghị thu tiền", "req-list":"🏠 Danh sách đề nghị thu tiền",
  "req-detail":"🏠 Danh sách đề nghị thu tiền", "refund-list":"🏠 Danh sách đề nghị thu tiền / Danh sách đề nghị hoàn tiền chờ xử lý",
  "receipt":"🏠 Danh sách đề nghị thu tiền / Phiếu Thu",
  "req-pending":"🏠 Danh sách đề nghị thu tiền / Danh sách đề nghị thu tiền chờ xử lý",
  "req-done":"🏠 Danh sách đề nghị thu tiền / Danh sách đề nghị thu tiền đã xử lý",
  "transfer-wait":"🏠 Danh sách đề nghị thu tiền / Chuyển khoản chờ xác nhận", "voucher-chi":"🏠 Danh sách đề nghị thu tiền / Phiếu chi",
  "acc-refund":"🏠 Danh sách đề nghị thu tiền / Danh sách đề nghị hoàn tiền chờ xử lý",
  "hd-coc-list":"🏠 Hợp đồng / Hợp đồng cọc", "hd-coc-detail":"🏠 Hợp đồng / Chi tiết hợp đồng cọc",
  "hd-mb-list":"🏠 Hợp đồng / Hợp đồng mua bán/ Thuê", "hd-mb-detail":"🏠 Hợp đồng / Chi tiết hợp đồng mua bán/ Thuê",
  "hd-cn-list":"🏠 Hợp đồng / Hợp đồng chuyển nhượng", "hd-cn-detail":"🏠 Hợp đồng / Chi tiết hợp đồng chuyển nhượng",
  "hd-importlog":"🏠 Hợp đồng / Lịch sử tải nhập", "hd-no-lai":"🏠 Hợp đồng / Thống kê nợ lãi",
  "hd-baocao":"🏠 Hợp đồng / Báo cáo hợp đồng dự án",
  "profile":"🏠 Tài khoản",
  "erp-sync":"🏠 Đồng bộ ERP", "dxhome":"🏠 Quản lý thông báo DxHome",
};
CFG.ROUTE_GROUP = {'req-detail':'payments','ctbh':'projects','detail':'projects','project-form':'projects',
  'pay-detail':'policy','disc-detail':'policy','pay-form':'policy','disc-form':'policy','receipt':'accounting',
  'hd-coc-detail':'contracts','hd-mb-detail':'contracts','hd-cn-detail':'contracts'};

/* route -> cap cần để xem (chặn truy cập thẳng) */
CFG.ROUTE_CAP = {
  "project-form":"project.config","ctbh":"ctbh.manage","detail":"projects.view",
  "pay-form":"policy.create","disc-form":"policy.create",
  "req-create":"payment.view","receipt":"accounting.approve","voucher-chi":"accounting.approve",
  "rbac":"rbac","tvv":"tvv",
};

/* Engine cơ cấu giá — hằng số theo file Excel gốc */
CFG.PRICE = { QSD_RATE:461505, KPBT_RATE:0.02, VAT_RATE:0.10 };

/* Hàng đợi ưu tiên — thời gian giữ ưu tiên 1 (phút) trước khi tự trả */
CFG.QUEUE = { defaultHoldMin: 10, maxPriority: 3 };
