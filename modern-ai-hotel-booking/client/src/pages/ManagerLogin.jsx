import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Building2,
  LockKeyhole,
  Mail,
  LoaderCircle,
} from "lucide-react";
import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { staffLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const MANAGER_ROLES = ["ADMIN", "HOTEL_OWNER"];

const inputClass =
  "w-full rounded-xl border border-[#dce7e5] bg-[#f6f9f8] py-3 pl-11 pr-4 text-sm text-[#102d35] outline-none transition duration-200 placeholder:text-[#829591] focus:border-[#087e83] focus:bg-white focus:ring-4 focus:ring-[#087e83]/10";

/**
 * Đăng nhập dành riêng cho Quản lý (Admin & Hotel Owner) vào trang Dashboard.
 * Khách hàng đăng nhập ở trang /login (mã OTP, Google, Facebook).
 */
function ManagerLogin() {
  const { user, isAuthenticated, login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Admin đăng nhập thành công sẽ vào trang quản trị
  if (isAuthenticated && MANAGER_ROLES.includes(user?.role)) {
    if (user?.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }

    if (user?.role === "HOTEL_OWNER") {
      return <Navigate to="/hotel-owner" replace />;
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const data = await staffLogin(form.email.trim(), form.password);

      login(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="seeyahh-manager-login min-h-dvh bg-[#f4f7f6] text-[#102d35] lg:grid lg:grid-cols-[1.15fr_1fr]">
      <style>{`
        @keyframes syManagerReveal { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .sy-manager-reveal { animation: syManagerReveal .65s ease-out both; }
        @media (min-width: 1024px) and (max-height: 760px) {
          .seeyahh-manager-login > section:first-of-type { padding-block: 24px; }
          .sy-manager-panel { padding-block: 12px; }
          .sy-manager-panel > .sy-manager-reveal { padding: 20px 28px; }
          .sy-manager-panel > .sy-manager-reveal > div:first-child { margin-bottom: 12px; }
          .sy-manager-panel > .sy-manager-reveal > div:first-child > span { width: 40px; height: 40px; margin-bottom: 8px; }
          .sy-manager-panel > .sy-manager-reveal h1 { font-size: 26px; line-height: 1.2; }
          .sy-manager-panel > .sy-manager-reveal > div:last-child { margin-top: 12px; padding-top: 10px; }
          .sy-manager-panel > p:last-child { margin-top: 8px; }
        }
        @media (prefers-reduced-motion: reduce) { .sy-manager-reveal { animation: none; } }
      `}</style>
      <section className="relative isolate flex min-h-[280px] flex-col justify-between overflow-hidden bg-[#102d35] px-7 py-8 text-white sm:px-12 lg:min-h-dvh lg:px-12 lg:py-9">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1920&auto=format&fit=crop')",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071f26] via-[#102d35]/75 to-[#102d35]/55"
        />
        <Link
          to="/"
          className="flex w-fit items-center gap-3 text-white no-underline"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#c49a61]/60 bg-white/10 text-[#e8c897] backdrop-blur-md">
            <Building2 size={23} />
          </span>
          <span>
            <span className="block text-2xl font-bold tracking-tight">
              SeeYAHH!
            </span>
            <span className="block text-[10px] font-semibold tracking-[.23em] text-[#e8c897]">
              MANAGEMENT PORTAL
            </span>
          </span>
        </Link>
        <div className="sy-manager-reveal mt-8 max-w-xl lg:my-5">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide backdrop-blur-md">
            <ShieldCheck size={15} className="text-[#e8c897]" /> Không gian quản
            trị
          </div>
          <h2 className="font-serif text-4xl leading-[1.12] text-white sm:text-5xl xl:text-[clamp(2.5rem,3.5vw,3.5rem)]">
            Nâng tầm vận hành.
            <br />
            <span className="italic text-[#e8c897]">Kiến tạo trải nghiệm.</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
            Quản lý khách sạn, theo dõi đặt phòng và tối ưu doanh thu trên một
            nền tảng thống nhất.
          </p>
          <div className="mt-5 hidden gap-3 text-xs text-white/75 lg:flex">
            <span className="rounded-full border border-white/20 px-4 py-2">
              Quản trị viên
            </span>
            <span className="rounded-full border border-white/20 px-4 py-2">
              Chủ khách sạn
            </span>
          </div>
        </div>
        <p className="mt-4 hidden text-xs tracking-wide text-white/60 lg:block">
          SeeYAHH! · Premium hospitality management
        </p>
      </section>
      <section className="sy-manager-panel relative flex min-w-0 flex-col justify-center px-5 py-5 sm:px-10 lg:px-12 xl:px-16">
        <div className="mx-auto mb-2 w-full max-w-md">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#526e70] transition hover:bg-[#e8f4f1] hover:text-[#087e83] focus-visible:outline-2 focus-visible:outline-[#087e83]"
          >
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
        </div>
        <div className="sy-manager-reveal mx-auto w-full max-w-md rounded-[28px] border border-[#e0eae7] bg-white p-7 shadow-[0_20px_70px_rgba(16,45,53,0.08)] sm:p-7">
          <div className="mb-4">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f4f1] text-[#087e83]">
              <ShieldCheck size={27} />
            </span>
            <p className="mb-2 text-[11px] font-bold tracking-[.2em] text-[#98703e]">
              STAFF ACCESS
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#102d35]">
              Đăng nhập quản trị
            </h1>
            <p className="mt-2 text-sm leading-5 text-[#617977]">
              Chào mừng trở lại. Đăng nhập bằng tài khoản quản trị viên hoặc chủ
              khách sạn của bạn.
            </p>
          </div>
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            aria-busy={loading}
          >
            <div>
              <label
                htmlFor="manager-email"
                className="mb-1.5 block text-sm font-semibold"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78918e]"
                />
                <input
                  id="manager-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Nhập email quản trị"
                  autoComplete="username"
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="manager-password"
                className="mb-1.5 block text-sm font-semibold"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78918e]"
                />
                <input
                  id="manager-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  maxLength={72}
                  className={`${inputClass} pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#78918e] transition hover:bg-[#e8f4f1] hover:text-[#087e83]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#087e83] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#087e83]/20 transition duration-200 hover:bg-[#06686d] hover:shadow-xl active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="motion-safe:animate-spin"
                  />{" "}
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập{" "}
                  <ArrowRight
                    size={17}
                    className="transition-transform motion-safe:group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
          <div className="mt-4 flex items-start gap-2 border-t border-[#e5edeb] pt-3 text-xs leading-5 text-[#617977]">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#087e83]" />{" "}
            Khu vực dành riêng cho tài khoản có quyền quản trị hoặc quản lý
            khách sạn.
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-[#617977]">
          © {new Date().getFullYear()} SeeYAHH! · Management Portal
        </p>
      </section>
    </main>
  );
}

export default ManagerLogin;
