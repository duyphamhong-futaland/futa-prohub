/* ============================================================
   FUTA Land — Prohub  ·  seed.js
   Dữ liệu demo chuẩn hoá. Sản phẩm là "hub": khách hàng / YCDCH /
   YCDCO / hợp đồng / phiếu thu đều tham chiếu cùng một mã SP, nên một
   thay đổi trạng thái lan toả nhất quán qua mọi màn hình.
   ============================================================ */
function SEED(){
  const n = s => +String(s).replace(/[^\d]/g,'') || 0;   // "10.430.945.472" -> số

  /* ---------- Dự án + ĐVBH + CTBH ---------- */
  const projects = [
    {id:"P1", ten:"Dự án đào tạo Đợt 1", code:"FUTA", loai:"Căn hộ",  chuDauTu:"Công ty CP BĐS FUTA Land", trangThai:"Đang mở bán"},
    {id:"P2", ten:"Đà Nẵng Times Square", code:"DNTS", loai:"Căn hộ", chuDauTu:"Công ty CP BĐS FUTA Land", trangThai:"Đang mở bán"},
    {id:"P3", ten:"Futaland Demo", code:"FUTA", loai:"Căn hộ", chuDauTu:"Phương Trang", trangThai:"Sắp mở bán"},
    {id:"P4", ten:"FUTA Kim Phát", code:"FUTA", loai:"Căn hộ", chuDauTu:"Phương Trang", trangThai:"Sắp mở bán"},
    {id:"P5", ten:"Hampton by Hilton", code:"FUTA", loai:"Căn hộ", chuDauTu:"Phương Trang", trangThai:"Sắp mở bán"},
    {id:"P6", ten:"KĐT Thuận Phước", code:"FUTA", loai:"Đất nền", chuDauTu:"Phương Trang", trangThai:"Đã đóng"},
  ];
  const dvbhList = ["KHO SẢN PHẨM","KHO THỊ TRƯỜNG","Đại lý A","Đại lý B","Đại lý C",
    "Cty TNHH Thương Mại Dịch vụ NINA SG","Sàn FutaLand"];

  const ctbhRows = [
    {duAn:"Dự án đào tạo Đợt 1", ten:"MỞ BÁN ĐỢT 3", ma:"MB3", active:true},
    {duAn:"Căn hộ cao tầng H&A", ten:"Mở bán H&A", ma:"BHHNA", active:false},
    {duAn:"Khu Đô Thị C5B", ten:"Mở bán C5B", ma:"C5B", active:false},
    {duAn:"Đà Nẵng Times Square", ten:"Mở bán CT3", ma:"CT3", active:false},
    {duAn:"Dự án đào tạo Đợt 1", ten:"Test - CTBH CT3", ma:"TEST-BHCT3", active:false},
    {duAn:"Dự án đào tạo Đợt 1", ten:"Futa CT007", ma:"FTCT007", active:true},
    {duAn:"Futaland Demo Cũ", ten:"Mở bán CT7", ma:"CT7", active:true},
    {duAn:"Dự án đào tạo Đợt 1", ten:"Mở bán", ma:"abcd", active:false},
    {duAn:"Futaland Demo Cũ", ten:"Mở bán CT7", ma:"abc", active:true},
    {duAn:"Đà Nẵng Times Square", ten:"Mở bán CT7", ma:"CT7", active:false},
  ];
  /* CTBH đang thao tác trong màn "Quản lý bán hàng" (Dự án đào tạo Đợt 1) */
  const ctbh = {id:"CTBH1", duAnId:"P1", ten:"Futa CT007", ma:"FTCT007", active:true, holdMin:10,
    blocks:[
      {block:"CT3", floors:["009","008","007","06","05"], cols:["01","02","03","04","05","06","07","08","09","10","11","12"], mode:"light"},
      {block:"CT7", floors:["030","029","028","027","026","025","024","023","022","021","020","019","018","017","016","015","014","013","012A","011","010","009","008","007","006","005"],
        cols:["001","002","003","004","005","006","007","008","009","010","011","012"], mode:"heavy"},
    ]};

  /* ---------- Khách hàng ---------- */
  const customers = [
    {id:"C1", name:"LÊ HOÀNG CÔNG DANH", gender:"Nam", dob:"19/12/1995", phone:"0602605254", email:"danhle.190996@gmail.com", cccd:"048565600000", ngayCap:"11/12/2025", noiCap:"Cục Cảnh sát QLHC về TTXH", diaChi:"Việt Nam"},
    {id:"C2", name:"NGUYỄN PHÚ MINH", gender:"Nam", dob:"02/05/1990", phone:"0905112233", email:"minhnp@gmail.com", cccd:"048090112233", diaChi:"Đà Nẵng, Việt Nam"},
    {id:"C3", name:"NGUYỄN VAN VŨ (CHỌN)", gender:"Nam", dob:"10/10/1988", phone:"0900001111", email:"ab@ab.com", cccd:"048088001111", diaChi:"Việt Nam"},
    {id:"C4", name:"PHẠM THỊ CẨM THI", gender:"Nữ", dob:"03/02/1989", phone:"0905358343", email:"thiptc@dkravirgo.vn", cccd:"049189002464", ngayCap:"26/01/2022", noiCap:"Cục Cảnh sát QLHC về TTXH", diaChi:"Việt Nam"},
    {id:"C5", name:"HUỲNH LÊN", gender:"Nam", dob:"05/05/1985", phone:"0921222222", email:"len@vx.vn", cccd:"2031111", diaChi:"Việt Nam"},
    {id:"C6", name:"PHẠM DUY HƯNG", gender:"Nam", dob:"12/07/1992", phone:"0934882774", email:"hungpd@mmg.vn", cccd:"0345588321", diaChi:"Việt Nam"},
    {id:"C7", name:"TRƯƠNG NGUYỄN HOÀNG", gender:"Nam", dob:"22/03/1987", phone:"0903005198", email:"longnh@ihouzz.com", cccd:"048087005198", diaChi:"Việt Nam"},
  ];
  const custByName = {}; customers.forEach(c=>custByName[c.name]=c.id);

  /* ---------- SẢN PHẨM (căn) ---------- */
  // (a) Các căn giao dịch đã có khách (đầy đủ cơ cấu, đa trạng thái)
  const named = [
   {ma:'CT7-30.01',block:'CT7',tang:'030',lo:'01',loai:'Studio',ttuy:45.49,tim:0,huong:'Tây Bắc',cua:'Đông',giaCB:n('10.430.945.472'),donGia:n('229.301.945'),giaVAT:n('11.682.658.929'),status:'da_coc',kh:'LÊ HOÀNG CÔNG DANH',tvv:'Lê Hoàng Công Danh',dvbh:'Đại lý C'},
   {ma:'CT7-05.01',block:'CT7',tang:'005',lo:'01',loai:'Căn 2PN',ttuy:68.20,tim:74.1,huong:'Đông Nam',cua:'Nam',giaCB:n('6.133.733.327'),donGia:n('89.937.000'),giaVAT:n('6.747.106.660'),status:'da_coc',kh:'NGUYỄN PHÚ MINH',tvv:'Lê Anh Minh',dvbh:'Đại lý A'},
   {ma:'CT7-05.07',block:'CT7',tang:'005',lo:'07',loai:'Căn 2PN',ttuy:70.30,tim:76.3,huong:'Tây Bắc',cua:'Tây',giaCB:n('10.600.000.000'),donGia:n('150.782.000'),giaVAT:n('11.660.000.000'),status:'kiem_tra',kh:'LÊ HOÀNG CÔNG DANH',tvv:'Lê Hoàng Công Danh',dvbh:'Đại lý C'},
   {ma:'CT7-09.03',block:'CT7',tang:'009',lo:'03',loai:'Căn 3PN',ttuy:95.40,tim:102.0,huong:'Đông',cua:'Đông',giaCB:n('14.074.634.367'),donGia:n('147.533.000'),giaVAT:n('15.482.000.000'),status:'cho_duyet',kh:'NGUYỄN VAN VŨ (CHỌN)',tvv:'Vu-Test app',dvbh:'Đại lý A'},
   {ma:'CT7-09.08',block:'CT7',tang:'009',lo:'08',loai:'Căn 3PN',ttuy:95.40,tim:102.0,huong:'Đông',cua:'Đông',giaCB:n('6.442.512.636'),donGia:n('67.531.000'),giaVAT:n('7.086.000.000'),status:'mo_ban',kh:'',tvv:'',dvbh:'Đại lý A'},
   {ma:'CT7-08.02',block:'CT7',tang:'008',lo:'02',loai:'Căn 2PN',ttuy:70.30,tim:76.3,huong:'Tây Bắc',cua:'Tây',giaCB:n('10.000.000.000'),donGia:n('142.247.000'),giaVAT:n('11.000.000.000'),status:'da_coc',kh:'LÊ HOÀNG CÔNG DANH',tvv:'Lê Hoàng Công Danh',dvbh:'Đại lý A'},
   {ma:'CT7-09.04',block:'CT7',tang:'009',lo:'04',loai:'Căn 3PN',ttuy:95.40,tim:102.0,huong:'Đông',cua:'Đông',giaCB:n('10.000.000.000'),donGia:n('104.821.000'),giaVAT:n('11.000.000.000'),status:'da_coc',kh:'TRƯƠNG NGUYỄN HOÀNG',tvv:'Nguyễn Hoàng Long',dvbh:'Đại lý C'},
   {ma:'CT7-11.04',block:'CT7',tang:'011',lo:'04',loai:'Căn 2PN',ttuy:70.30,tim:76.3,huong:'Tây',cua:'Tây',giaCB:n('10.000.000.000'),donGia:n('142.247.000'),giaVAT:n('11.000.000.000'),status:'cho_duyet',kh:'NGUYỄN VAN VŨ (CHỌN)',tvv:'Vu-Test app',dvbh:'Đại lý A'},
  ];
  const products = [];
  named.forEach(p=>{
    products.push({id:p.ma, ma:p.ma, duAnId:"P1", ctbhId:"CTBH1", block:p.block, tang:p.tang, lo:p.lo,
      loai:p.loai, ttuy:p.ttuy, tim:p.tim, huong:p.huong, cua:p.cua,
      giaCB:p.giaCB, donGia:p.donGia, giaVAT:p.giaVAT, congKhaiGia:true,
      status:p.status, customerId:p.kh?custByName[p.kh]||null:null, khName:p.kh||"",
      tvv:p.tvv||"", dvbh:p.dvbh||"", history:[]});
  });
  const namedSet = new Set(named.map(p=>p.ma));

  // (b) Lưới căn còn lại — sinh tự động, phần lớn chưa mở bán / đang mở bán
  const distHeavy = [["da_coc",8],["kiem_tra",6],["dang_ky",4],["mo_ban",6],["hop_dong",3],["dvbh_khac",2],["cho_duyet",3]];
  ctbh.blocks.forEach(b=>{
    b.floors.forEach(f=>{
      if(f==="013"||f==="012A") return;                 // tầng kỹ thuật, bỏ
      b.cols.forEach(c=>{
        const ma = `${b.block}-${f}.${c}`;
        if(namedSet.has(ma)) return;
        const seed = (parseInt(f.replace(/\D/g,''))*37 + parseInt(c)*19) % 100;
        let status = "chua_mo_ban";
        if(b.mode==="heavy"){
          let acc=10; for(const [st,w] of distHeavy){ acc+=w; if(seed<acc){status=st;break;} }
          if(seed>=58) status = seed<88 ? "chua_mo_ban" : "mo_ban";
        } else {
          status = seed<82 ? "chua_mo_ban" : "mo_ban";
        }
        const ttuy = 45 + (seed%70);
        const giaCB = Math.round((6 + (seed%9)) * 1e9);
        // căn đang giao dịch → gán ĐVBH (để lọc theo ĐVBH có ý nghĩa)
        const owned = ["dvbh_khac","dang_ky","kiem_tra","cho_duyet","da_coc","hop_dong"].indexOf(status)>=0;
        const dvbh = owned ? ["Đại lý A","Đại lý B","Đại lý C"][seed%3] : "";
        products.push({id:ma, ma, duAnId:"P1", ctbhId:"CTBH1", block:b.block, tang:f, lo:c,
          loai: seed%3===0?"Studio":seed%3===1?"Căn 2PN":"Căn 3PN", ttuy, tim:ttuy+6,
          huong:["Đông","Tây","Nam","Bắc","Đông Nam","Tây Bắc"][seed%6], cua:["Đông","Tây","Nam","Bắc"][seed%4],
          giaCB, donGia:Math.round(giaCB/ttuy), giaVAT:Math.round(giaCB*1.1),
          congKhaiGia: status!=="chua_mo_ban", status,
          customerId:null, khName:"", tvv:"", dvbh, history:[], queue:[]});
      });
    });
  });

  /* ---------- YCDCH (đặt chỗ) ---------- */
  const ycdch = [
   {ma:'Test-YCDCH-00100',productMa:'',erp:'',pt:'',ttpt:'',tien:'',customerId:'C4',kh:'PHẠM THỊ CẨM THI',sdt:'0905358343',cccd:'049189002464',tvv:'Admin DKRA Virgo',san:'DKRA VIRGO',dvbh:'DKRA VIRGO',tg:'09/01/2026 15:52',status:'cho_xn'},
   {ma:'Test-YCDCH-00099',productMa:'',erp:'',pt:'PT-000000042',ttpt:'Đã duyệt',tien:'100.000.000',customerId:'C5',kh:'HUỲNH LÊN',sdt:'0921222222',cccd:'2031111',tvv:'Lê Anh Minh',san:'VIỆT XANH MIỀN TRUNG',dvbh:'Đại lý A',tg:'07/11/2025 11:02',status:'giu_cho'},
   {ma:'Test-YCDCH-00098',productMa:'',erp:'',pt:'PT-000000037',ttpt:'Đã duyệt',tien:'100.000.000',customerId:'C6',kh:'PHẠM DUY HƯNG',sdt:'0934882774',cccd:'0345588321',tvv:'Lê Hoàng Công Danh',san:'MINH MINH GROUP',dvbh:'Đại lý C',tg:'07/11/2025 10:55',status:'giu_cho'},
  ];

  /* ---------- YCDCO (đặt cọc) ---------- */
  const ycdco = [
   {ma:'Test-YCDC-00374',hd:'',productMa:'CT7-11.04',kh:'NGUYỄN VAN VŨ (CHỌN)',sdt:'0900001111',tvv:'Vu-Test app',san:'Đại lý A',dvbh:'Đại lý A',tg:'23/06/2026 17:26:52',status:'cho_kt'},
   {ma:'Test-YCDC-00373',hd:'',productMa:'CT7-09.03',kh:'NGUYỄN VAN VŨ (CHỌN)',sdt:'0900001111',tvv:'Vu-Test app',san:'Đại lý A',dvbh:'Đại lý A',tg:'23/06/2026 17:26:19',status:'cho_kt'},
   {ma:'Test-YCDC-00368',hd:'',productMa:'',kh:'NGUYỄN VAN VŨ (CHỌN)',sdt:'0900001111',tvv:'Vu-Test app',san:'Đại lý A',dvbh:'Đại lý A',tg:'23/06/2026 10:51:26',status:'xac_coc'},
   {ma:'Test-YCDC-00367',hd:'HĐC-Test-00027',productMa:'CT7-09.05',kh:'NGUYỄN VAN VŨ (CHỌN)',sdt:'0900001111',tvv:'Vu-Test app',san:'Đại lý A',dvbh:'Đại lý A',tg:'23/06/2026 10:07:18',status:'da_coc'},
   {ma:'Test-YCDC-00364',hd:'HĐC-Test-00025',productMa:'CT7-09.04',kh:'TRƯƠNG NGUYỄN HOÀNG',sdt:'0903005198',tvv:'Nguyễn Hoàng Long',san:'Đại lý C',dvbh:'Đại lý C',tg:'02/06/2026 14:35:04',status:'da_coc'},
   {ma:'Test-YCDC-00357',hd:'',productMa:'',kh:'công ty a',sdt:'0987654320',tvv:'Lê Anh Minh',san:'Đại lý A',dvbh:'Đại lý A',tg:'27/04/2026 12:18:36',status:'da_coc'},
   {ma:'Test-YCDC-00351',hd:'',productMa:'CT7-30.01',kh:'HOÀNG CÔNG DANH',sdt:'0602605254',tvv:'Lê Anh Minh',san:'Đại lý A',dvbh:'Đại lý A',tg:'25/04/2026 05:06:00',status:'da_coc'},
   {ma:'Test-YCDC-00348',hd:'',productMa:'',kh:'NGUYỄN HOÀNG PHONG',sdt:'0634114012',tvv:'Nguyễn Hoàng Long',san:'Đại lý C',dvbh:'Đại lý C',tg:'24/04/2026 10:23:06',status:'xac_coc'},
  ];

  /* ---------- Chính sách thanh toán / chiết khấu ---------- */
  const polTT = [
    ['CSTT-00042','PTTT VAY NH CT7 (ĐỢT 2)','Đà Nẵng Times Square','01/05/2026 - 01/05/2040','duyet'],
    ['CSTT-00041','PTTT GIÃN CT7 (ĐỢT 2)','Đà Nẵng Times Square','01/05/2026 - 01/05/2040','duyet'],
    ['CSTT-00040','PTTT NHANH CT7 (ĐỢT 2)','Đà Nẵng Times Square','01/05/2026 - 01/05/2040','duyet'],
    ['CSTT-00043','PTTT GIÃN CT3 ( ĐỢT 2 )','Đà Nẵng Times Square','01/05/2026 - 01/05/2040','duyet'],
    ['CSTT-00044','PTTT VAY NH CT3 (ĐỢT 2)','Đà Nẵng Times Square','01/05/2026 - 01/05/2040','duyet'],
    ['CSTT-00036','PTTT chuẩn H&A','Dự án đào tạo Đợt 1','01/04/2026 - 01/04/2040','duyet'],
    ['CSTT-00037','CSTT Vay H&A','Dự án đào tạo Đợt 1','01/04/2026 - 01/04/2040','duyet'],
    ['CSTT-00004','CS PTTT chuẩn ( CT7 )','Đà Nẵng Times Square','04/11/2025 - 01/11/2040','duyet'],
    ['CSTT-00006','CS PTTT nhanh ( CT7 )','Đà Nẵng Times Square','01/11/2025 - 04/11/2040','duyet'],
    ['CSTT-00050','CS PTTT chuẩn (mới)','Dự án đào tạo Đợt 1','25/06/2026 - 25/06/2040','khoi_tao'],
  ].map(r=>({ma:r[0], ten:r[1], duAn:r[2], thoiGian:r[3], status:r[4], loai:"tt"}));
  const polCK = [
    ['CSCK-00012','CSCK Early Bird Demo','Futaland Demo','12/11/2025 - 12/11/2025','khoi_tao'],
    ['CSCK-00011','CSCK Early Bird','Futaland Demo','01/11/2025 - 08/11/2026','duyet'],
    ['CSCK-00010','CSCK mua sỉ từ 3 sản phẩm','Futaland Demo','01/11/2025 - 08/11/2026','duyet'],
    ['CSCK-00009','CSCK mua sỉ 2 sản phẩm','Futaland Demo','01/11/2025 - 08/11/2026','duyet'],
    ['CSCK-00006','CSCK Early Bird','Đà Nẵng Times Square','01/11/2025 - 01/11/2026','duyet'],
    ['CSCK-00003','[Hủy] CSCK Hủy','Futaland Demo','01/11/2025 - 01/11/2025','duyet'],
  ].map(r=>({ma:r[0], ten:r[1], duAn:r[2], thoiGian:r[3], status:r[4], loai:"ck"}));

  /* ---------- Đề nghị thu tiền (Thanh toán / Kế toán) ---------- */
  const payReqs = [
   ['Đà Nẵng Times Square','PT-000000951','Yêu cầu đặt cọc','NGUYỄN THỊ TUYẾT VÂN','BDS SMARTLAND','da_duyet','20/06/2026 08:42','','','DTS-YCDC-00352','CT7-09.09','100.000.000'],
   ['Khu Đô Thị C5B','PT-000000934','Yêu cầu đặt cọc','TRẦN QUỐC ĐÔNG','HƯNG PHÁT CORP','da_duyet','15/06/2026 17:43','BCO2026060026','','C5B-YCDC-00199','LK4B-630','100.000.000'],
   ['Khu Đô Thị C5B','PT-000000950','Hợp đồng','ĐẶNG PHƯƠNG HẰNG','Sàn FutaLand','da_duyet','16/06/2026 10:23','BCO2026060025','','HĐC-C5B-00053','SH4A-516','500.000.000'],
   ['Đà Nẵng Times Square','PT-000000947','Hợp đồng','NGUYỄN THỊ THƠ','VIỆT XANH MIỀN TRUNG','da_duyet','16/06/2026 10:18','BCO2026060022','','HĐC-DTS-00113','CT7-24.09','350.000.000'],
   ['Đà Nẵng Times Square','PT-000000933','Yêu cầu đặt cọc','NGUYỄN THỊ HẬU','Sàn FutaLand','da_duyet','15/06/2026 14:05','BCO2026060009','','DTS-YCDC-00351','CT7-08.01','100.000.000'],
   ['Đà Nẵng Times Square','PT-000000932','Hợp đồng','LÊ THỊ NGỌC CHÂU','VIỆT XANH MIỀN TRUNG','da_duyet','10/06/2026 11:12','BCO2026060008','','HĐC-DTS-00124','CT3-12.05','420.000.000'],
   ['Đà Nẵng Times Square','PT-000000930','Hợp đồng','NINH ĐÌNH CHI','BDS THẾ KỶ','da_duyet','08/06/2026 15:38','BCO2026060006','','HĐC-DTS-00025','CT7-17.04','300.000.000'],
   ['Đà Nẵng Times Square','PT-000000927','Hợp đồng','PHẠM THỊ NHUNG','BDS SMARTLAND','da_duyet','08/06/2026 15:28','BCO2026060003','','HĐC-DTS-00028','CT7-12.05','300.000.000'],
  ].map(r=>({duAn:r[0], ma:r[1], loaiPhieu:r[2], kh:r[3], san:r[4], status:r[5], ngayTao:r[6], chungTu:r[7], ycdch:r[8], ycHd:r[9], sp:r[10], soTien:r[11]}));

  /* ---------- Hợp đồng cọc / mua bán / chuyển nhượng ---------- */
  const hdCoc = [
   ['HĐC-Test-00028','HĐC-TEST-00028-NGUYỄN VAN VŨ (CHỌN)','Dự án đào tạo Đợt 1','Mở bán','CT7-09.02','Test-YCDC-…','24/06/2026','cho_kt'],
   ['HĐC-Test-00027','HĐC-TEST-00027-NGUYỄN VAN VŨ (CHỌN)','Dự án đào tạo Đợt 1','Mở bán','CT7-09.05','Test-YCDC-00367','23/06/2026','khoi_tao'],
   ['HĐC-Test-00026','HĐC-TEST-00026-NGUYỄN VAN VŨ (CHỌN)','Dự án đào tạo Đợt 1','Mở bán','CT7-09.01','Test-YCDC-…','23/06/2026','khoi_tao'],
   ['HĐC-Test-00025','HĐC-TEST-00025-TRƯƠNG NGUYỄN HOÀNG','Dự án đào tạo Đợt 1','Mở bán','CT7-09.04','Test-YCDC-00364','02/06/2026','cho_kt'],
   ['HĐC-DTS-00179','HĐC-DTS-00179-NGUYỄN HÙNG','Đà Nẵng Times Square','Mở bán CT7','CT7-08.09','DTS-YCDC-…','22/05/2026','da_duyet'],
   ['HĐC-DTS-00178','HĐC-DTS-00178-VÕ LÊ VY','Đà Nẵng Times Square','Mở bán CT7','CT7-27.10','DTS-YCDC-…','12/05/2026','da_duyet'],
   ['HĐC-Test-00024','HĐC-TEST-00024-LÊ HOÀNG CÔNG DANH','Dự án đào tạo Đợt 1','Mở bán','CT7-20.10','Test-YCDC-…','24/04/2026','cho_kt'],
   ['HĐC-Test-00021','HĐC-TEST-00021-NGUYỄN HOÀNG','Dự án đào tạo Đợt 1','Mở bán','CT7-08.10','Test-YCDC-…','15/04/2026','da_duyet'],
   ['HĐC-Test-00020','HĐC-TEST-00020-LÊ HOÀNG CÔNG DANH','Dự án đào tạo Đợt 1','Mở bán','CT7-08.03','Test-YCDC-…','14/04/2026','da_duyet'],
  ].map(r=>({so:r[0], ten:r[1], duAn:r[2], ctbh:r[3], sp:r[4], phieuCoc:r[5], ngayTao:r[6], status:r[7]}));
  const hdMB = [
   ['HDMB-Test-00006','HDMB-TEST-00006-NGUYỄN HOÀNG PHONG','CT7-08.10','HĐC-Test-00021','HĐC-Test-00021-NGUYỄN HOÀNG LONG','24/04/2026','cho_kt'],
   ['HDMB-Test-00005','HDMB-TEST-00005-LÊ HOÀNG CÔNG DANH','CT7-08.03','HĐC-Test-00020','HĐC-TEST-00020-LÊ HOÀNG CÔNG DANH','24/04/2026','cho_kt'],
   ['HDMB-Test-00004','HDMB-TEST-00004-LÊ HOÀNG CÔNG DANH','CT7-06.01','HĐCN-Test-00004','HĐCN-TEST-00004-Danh','14/04/2026','khoi_tao'],
   ['HDMB-Test-00002','HDMB-TEST-00002-LÊ HOÀNG CÔNG DANH','CT7-21.03','HĐC-Test-00011','','16/12/2025','cho_kt'],
   ['HDMB-Test-00001','HDMB-TEST-00001-LÊ HOÀNG CÔNG DANH','CT7-06.01','HĐC-Test-00016','','16/12/2025','cho_kt'],
  ].map(r=>({so:r[0], ten:r[1], sp:r[2], hdCoc:r[3], tenCoc:r[4], ngayTao:r[5], status:r[6]}));
  const hdCN = [
   ['HĐCN-Test-00004','HĐ Cọc','BBTL-00004','HĐCN-TEST-00004-DANH','CT7-06.01','LÊ HOÀNG CÔNG DANH','03/03/2026'],
   ['HĐCN-Test-00003','HĐ Cọc','BBTL-00003','HĐCN-TEST-00003-CHUYỂN NHƯỢNG KHÁCH MỚI','CT7-21.07','CHUYỂN NHƯỢNG KHÁCH MỚI','23/12/2025'],
   ['HĐCN-Test-00002','HĐ Cọc','BBTL-00002','HĐCN-TEST-00002-KHÁCH HÀNG PRO','CT7-21.04','KHÁCH HÀNG PRO','22/12/2025'],
   ['HĐCN-Test-00001','HĐ Cọc','BBTL-00001','HĐCN-TEST-00001-KHÁCH HÀNG ABC','CT7-21.06','KHÁCH HÀNG ABC','22/12/2025'],
  ].map(r=>({so:r[0], loai:r[1], bbtl:r[2], ten:r[3], sp:r[4], kh:r[5], ngayTao:r[6]}));

  /* ---------- Đề nghị hoàn tiền (mẫu) ---------- */
  const refunds = [
    {id:'HT-000002', productMa:'CT7-05.07', kh:'LÊ HOÀNG CÔNG DANH', soTien:'100.000.000', lyDo:'Khách đổi ý, xin hoàn cọc', dvbh:'Đại lý C', ngayTao:'20/06/2026 09:10', status:'cho_kt', hdc:''},
    {id:'HT-000001', productMa:'CT7-30.01', kh:'LÊ HOÀNG CÔNG DANH', soTien:'100.000.000', lyDo:'Hủy giữ chỗ', dvbh:'Đại lý C', ngayTao:'15/06/2026 14:25', status:'cho_kd', hdc:''},
  ];

  /* ---------- Nhật ký đồng bộ ERP (mẫu) ---------- */
  const erpLog = [
    {at:'20/06/2026 11:20', by:'Đặng Hữu Dự', docId:'PT-000000950', erpCode:'BCO2026060025', amount:'500.000.000', acct:'Nợ 112 / Có 131'},
    {at:'16/06/2026 10:25', by:'Đặng Hữu Dự', docId:'PT-000000947', erpCode:'BCO2026060022', amount:'350.000.000', acct:'Nợ 112 / Có 131'},
  ];
  /* ---------- Thông báo DxHome (mẫu) ---------- */
  const dxhome = [
    {id:'TB-0002', title:'Mở bán đợt 3 — Dự án đào tạo Đợt 1', body:'Chính thức mở bán 50 căn block CT7 từ 28/06/2026. ĐVBH chuẩn bị hồ sơ khách.', target:'ĐVBH', schedule:'28/06/2026 09:00', status:'sent', sentAt:'28/06/2026 09:00', reach:124},
    {id:'TB-0001', title:'Cập nhật chính sách chiết khấu CT7', body:'Áp dụng CSCK 1% cho khách thanh toán nhanh trong tháng 6.', target:'Tất cả', schedule:'', status:'draft', createdAt:'24/06/2026 10:00', reach:0},
  ];

  /* ---------- Bộ đếm mã tự tăng ---------- */
  const seq = {ycdch:101, ycdco:375, ptthu:952, hdcoc:29, hdmb:7, cstt:51, csck:13, project:7, refund:3, hdcn:5, bbtl:5, erp:27, dx:3};

  const audit = [
    {id:'au1', at:'24/06/2026 18:12', userId:'u_dl_a', userName:'Lê Anh Minh',      role:'dvbh',   action:'Đặt chỗ căn CT7-22.01 (Ưu tiên 1)',     target:'CT7-22.01'},
    {id:'au2', at:'24/06/2026 14:42', userId:'u_dl_c', userName:'Nguyễn Hoàng Long', role:'dvbh',   action:'Đăng ký giao dịch căn CT7-09.09',        target:'CT7-09.09'},
    {id:'au3', at:'24/06/2026 14:40', userId:'u_tpkd', userName:'Mai Văn Trí',       role:'tpkd',   action:'KD kiểm duyệt giao dịch căn CT7-09.03',  target:'CT7-09.03'},
    {id:'au4', at:'24/06/2026 11:18', userId:'u_kt',   userName:'Đặng Hữu Dự',       role:'ketoan', action:'Duyệt phiếu thu PT-000000951',           target:'PT-000000951'},
    {id:'au5', at:'24/06/2026 09:05', userId:'u_bgd',  userName:'Nguyễn Văn Đức',    role:'bgd',    action:'Duyệt chính sách thanh toán CSTT-00042', target:'CSTT-00042'},
    {id:'au6', at:'24/06/2026 08:10', userId:'u_admin',userName:'Trần Nguyễn Huy',   role:'admin',  action:'Đăng nhập hệ thống',                     target:''},
  ];
  const notifications = [
    {id:'ns1', title:'Sản phẩm', body:'Sản phẩm CT7-22.01 của dự án đào tạo Đợt 1 đã đăng ký bởi Đại lý A', cat:'Yêu cầu', at:'24/06/2026 18:12', read:false},
    {id:'ns2', title:'Sản phẩm', body:'Sản phẩm CT7-09.09 đã đăng ký bởi Đại lý C', cat:'Yêu cầu', at:'24/06/2026 14:42', read:false},
    {id:'ns3', title:'Hợp đồng', body:'Hợp đồng cọc HĐC-Test-00028 chờ Kế toán thu tiền', cat:'Hợp đồng', at:'24/06/2026 14:40', read:false},
    {id:'ns4', title:'Giao dịch', body:'Phiếu thu PT-000000951 đã được duyệt', cat:'Giao dịch', at:'24/06/2026 08:48', read:false},
    {id:'ns5', title:'Sản phẩm', body:'Sản phẩm CT7-09.03 chờ KD kiểm duyệt', cat:'Yêu cầu', at:'24/06/2026 08:18', read:true},
    {id:'ns6', title:'Cuộc gọi', body:'Khách hàng NGUYỄN VAN VŨ gọi nhỡ lúc 08:10', cat:'Cuộc gọi', at:'24/06/2026 08:18', read:true},
  ];
  return {
    version: 8,
    projects, dvbhList, ctbhRows, ctbh,
    customers, products,
    ycdch, ycdco,
    polTT, polCK,
    payReqs,
    hdCoc, hdMB, hdCN,
    refunds,
    erpLog, dxhome,
    seq,
    notifications,
    audit,
    attachments: {},
  };
}
