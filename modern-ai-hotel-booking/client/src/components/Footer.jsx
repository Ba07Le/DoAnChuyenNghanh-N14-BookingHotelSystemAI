import { Link } from "react-router-dom";

function Footer() {
  const handleSubscribe = (e) => {
    e.preventDefault();

    // Sau này có thể kết nối API đăng ký nhận email tại đây.
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      {/* Newsletter */}
      <div className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-blue-600 px-6 py-8 md:flex-row md:items-center md:px-10">
            {/* Content */}
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Nhận ưu đãi du lịch mới nhất
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-100">
                Đăng ký nhận thông tin về khách sạn, ưu đãi và những điểm đến
                hấp dẫn từ HOTELAI.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubscribe}
              className="flex w-full max-w-md gap-2"
            >
              <input
                type="email"
                placeholder="Email của bạn"
                required
                className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/20"
              />

              <button
                type="submit"
                className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-900 hover:shadow-lg"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center text-2xl font-bold tracking-tight text-white"
            >
              HOTEL
              <span className="text-blue-500">AI</span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Nền tảng đặt phòng khách sạn hiện đại, giúp bạn dễ dàng tìm kiếm,
              lựa chọn và đặt nơi lưu trú phù hợp cho mỗi chuyến đi.
            </p>

            {/* Social */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 text-sm font-bold text-slate-400 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:text-blue-500"
              >
                f
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 text-sm font-bold text-slate-400 transition-all duration-200 hover:-translate-y-1 hover:border-pink-500 hover:text-pink-500"
              >
                ig
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 text-sm font-bold text-slate-400 transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:text-sky-500"
              >
                𝕏
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Khám phá
            </h3>

            <div className="mt-5 space-y-3">
              <Link
                to="/hotels"
                className="block text-sm text-slate-400 transition-colors duration-200 hover:text-white"
              >
                Khách sạn
              </Link>

              <Link
                to="/destinations"
                className="block text-sm text-slate-400 transition-colors duration-200 hover:text-white"
              >
                Điểm đến
              </Link>

              <Link
                to="/deals"
                className="block text-sm text-slate-400 transition-colors duration-200 hover:text-white"
              >
                Ưu đãi
              </Link>

              <Link
                to="/bookings"
                className="block text-sm text-slate-400 transition-colors duration-200 hover:text-white"
              >
                Đặt phòng của tôi
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Hỗ trợ
            </h3>

            <div className="mt-5 space-y-3">
              <Link
                to="/help"
                className="block text-sm text-slate-400 transition-colors duration-200 hover:text-white"
              >
                Trung tâm trợ giúp
              </Link>

              <Link
                to="/booking-policy"
                className="block text-sm text-slate-400 transition-colors duration-200 hover:text-white"
              >
                Chính sách đặt phòng
              </Link>

              <Link
                to="/terms"
                className="block text-sm text-slate-400 transition-colors duration-200 hover:text-white"
              >
                Điều khoản sử dụng
              </Link>

              <Link
                to="/privacy"
                className="block text-sm text-slate-400 transition-colors duration-200 hover:text-white"
              >
                Chính sách bảo mật
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Liên hệ
            </h3>

            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs">
                  📍
                </div>

                <p className="text-sm leading-6 text-slate-400">Việt Nam</p>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs">
                  ☎
                </div>

                <p className="text-sm leading-6 text-slate-400">1900 0000</p>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs">
                  @
                </div>

                <p className="break-all text-sm leading-6 text-slate-400">
                  support@hotelai.vn
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} HOTELAI. All rights reserved.</p>

          <p>Modern AI-Powered Hotel Booking Platform</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
