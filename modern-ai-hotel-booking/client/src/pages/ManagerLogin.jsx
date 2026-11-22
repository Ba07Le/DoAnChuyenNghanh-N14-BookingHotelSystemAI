import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { staffLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const MANAGER_ROLES = ["ADMIN", "HOTEL_OWNER"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10";

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

  // Đăng nhập thành công (hoặc đã đăng nhập bằng tài khoản quản trị/chủ khách sạn) thì vào thẳng Dashboard
  if (isAuthenticated && MANAGER_ROLES.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1920&auto=format&fit=crop')`,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-transparent" />

      <div className="absolute left-0 top-0 bottom-0 hidden lg:flex lg:w-7/12 flex-col justify-between p-12 z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold tracking-wider text-white">
            HOTEL MANAGER
          </div>
        </div>
        <div className="max-w-xl pb-6">
          <h2 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
            Elevate Your Hotel Experience
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Hệ thống quản trị thông minh dành riêng cho quản trị viên và chủ
            khách sạn. Tối ưu hóa vận hành, quản lý đặt phòng và doanh thu hiệu
            quả trong một nền tảng duy nhất.
          </p>
        </div>
      </div>

      <div className="relative z-20 flex min-h-screen w-full lg:w-4/12 ml-auto flex-col justify-center bg-white px-6 py-10 lg:px-12 xl:px-16 rounded-l-[48px] shadow-2xl">
        <div className="mx-auto w-full max-w-xs">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 lg:hidden">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              Đăng nhập quản trị
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Dành cho quản trị viên và chủ khách sạn HOTELAI
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <input
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-700/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ManagerLogin;
