/* ============================================================
   FUTA Land — Prohub  ·  pricing.js
   Engine "Cơ cấu giá" — tái hiện đúng file Excel "Phiếu tính tiến độ
   thanh toán": từ giá niêm yết → chiết khấu → QSD đất → KPBT 2% →
   giá trị căn → VAT 10% → các đợt thanh toán lũy kế.
   ============================================================ */
const Pricing = (function(){
  const { QSD_RATE, KPBT_RATE, VAT_RATE } = CFG.PRICE;

  /* breakdown(giaNiemYet, dtThongThuy, {khtt, muaSi, khac})  */
  function breakdown(giaNiemYet, dtThongThuy, ck){
    ck = ck || {};
    const tongCK = (ck.khtt||0) + (ck.muaSi||0) + (ck.khac||0);   // (4)
    const giaPhaiTT = Math.max(0, giaNiemYet - tongCK);           // (5)
    const qsd = Math.round(QSD_RATE * (dtThongThuy||0));          // (6) không chịu VAT
    const kpbt = Math.round((giaPhaiTT - qsd) * KPBT_RATE);       // (7) KPBT 2%
    const giaTriCan = giaPhaiTT - qsd - kpbt;                     // (8)
    const vat = Math.round(giaTriCan * VAT_RATE);                 // (9) VAT 10%
    const giaChuaVAT = giaTriCan + qsd;                           // (10)
    const tong = giaChuaVAT + kpbt + vat;                         // = (5)
    return { giaNiemYet, tongCK, giaPhaiTT, qsd, kpbt, giaTriCan, vat, giaChuaVAT, tong };
  }

  /* Tạo lịch các đợt thanh toán từ tổng giá + định nghĩa đợt (tỷ lệ %).
     dotDef: [{ten, mo:'mô tả', tyLe: số %, han:'dd/mm/yyyy'|''}]
     Trả về [{stt, ten, mo, tyLe, han, soTien, daTT, conLai}] (lũy kế). */
  function installments(tong, dotDef){
    let acc = 0;
    return (dotDef||[]).map((d,i)=>{
      const soTien = Math.round(tong * (d.tyLe/100));
      acc += soTien;
      return { stt:i+1, ten:d.ten, mo:d.mo||`${d.tyLe}% Giá Trị Căn Hộ`, tyLe:d.tyLe,
        han:d.han||"", soTien, luyKe:acc, daTT:0, conLai:soTien };
    });
  }

  /* Bộ đợt mặc định (đúng form CS PTTT chuẩn) */
  const DEFAULT_DOT = [
    {ten:"Đăng ký NV", tyLe:5,  mo:"5% Giá Trị Căn Hộ"},
    {ten:"Đợt 1", tyLe:5,  mo:"5% Giá Trị Căn Hộ"},
    {ten:"Đợt 2", tyLe:10, mo:"10% Giá Trị Căn Hộ"},
    {ten:"Đợt 3", tyLe:10, mo:"10% Giá Trị Căn Hộ"},
    {ten:"Đợt 4", tyLe:20, mo:"20% Giá Trị Căn Hộ"},
    {ten:"Đợt 5", tyLe:20, mo:"20% Giá Trị Căn Hộ"},
    {ten:"Đợt 6", tyLe:25, mo:"25% Giá Trị Căn Hộ"},
    {ten:"Đợt 7", tyLe:5,  mo:"5% Giá Trị Căn Hộ"},
  ];

  /* Lãi phạt trễ hạn: số tiền × lãi suất ngày × số ngày trễ */
  function lateInterest(soTien, laiSuatNgay, soNgay){
    return Math.round((soTien||0) * (laiSuatNgay||0) * (soNgay||0));
  }

  return { breakdown, installments, lateInterest, DEFAULT_DOT };
})();
