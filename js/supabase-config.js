/* ============================================================
   FUTA Land — Prohub  ·  supabase-config.js
   Điền URL + ANON KEY (public) của dự án Supabase để app TỰ kết nối khi
   khởi động. Để TRỐNG → app chạy 100% offline (localStorage).

   ⚠️ CHỈ dùng ANON / PUBLIC key (an toàn nhúng client, bảo vệ bằng RLS).
      TUYỆT ĐỐI KHÔNG dán service_role key.
   Có thể nhập trực tiếp trong app: nút "🔌 Kết nối" trên thanh trên cùng.
   ============================================================ */
window.FUTA_PROHUB_CONFIG = {
  supabaseUrl: '',   // vd: https://xxxxxxxx.supabase.co
  supabaseKey: '',   // anon public key (bắt đầu bằng "eyJ...")
  autoSync: true,    // tự đẩy thay đổi lên cloud (debounce)
};
