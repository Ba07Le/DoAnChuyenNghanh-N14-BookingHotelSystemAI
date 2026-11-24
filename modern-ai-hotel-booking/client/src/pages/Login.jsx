import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { requestOtp, verifyOtp } from "../api/authApi";

import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Mail,
  Compass,
  Sparkles,
} from "lucide-react";

import SocialLoginButtons from "../components/SocialLoginButtons";
import { useAuth } from "../context/AuthContext";

const OTP_LENGTH = 6;
const REDIRECT_DELAY_MS = 1000;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const primaryButtonClass =
  "w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Hai phương thức đăng nhập
  const [method] = useState("otp");

  // Đăng nhập bằng OTP
  const [otpStep, setOtpStep] = useState("email");
  const [otpEmail, setOtpEmail] = useState(() => {
    const value =
      new URLSearchParams(location.search).get("email")?.trim() || "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : "";
  });
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Trạng thái giao diện
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTimer = useRef(null);

  // Keep the form in sync if a different email arrives through the footer link.
  useEffect(() => {
    const value =
      new URLSearchParams(location.search).get("email")?.trim() || "";
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setOtpEmail(value);
      setOtpStep("email");
      setCode("");
    }
  }, [location.search]);

  // Đếm ngược thời gian OTP
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;

    const timer = setTimeout(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Dọn timer khi rời trang
  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  // Lấy thông báo lỗi từ API
  const getErrorMessage = (err, fallback) => {
    return err.response?.data?.message || err.message || fallback;
  };

  // Xử lý chung khi đăng nhập thành công
  const handleLoginSuccess = (data) => {
    if (!data?.token || !data?.user) {
      setError("Dữ liệu đăng nhập không hợp lệ.");
      return;
    }

    if (data.user.role !== "CUSTOMER") {
      setError("Tài khoản quản trị vui lòng đăng nhập tại /manager/login.");
      return;
    }
    login(data);

    setError("");
    setSuccess(data.message || "Đăng nhập thành công.");

    // Quay lại trang trước đó hoặc trang chủ
    const from = location.state?.from;

    const destination =
      typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
        ? from
        : "/";

    redirectTimer.current = setTimeout(() => {
      navigate(destination, { replace: true });
    }, REDIRECT_DELAY_MS);
  };

  // GỬI MÃ OTP
  const sendCode = async () => {
    if (loading || success) return;

    const normalizedEmail = otpEmail.trim();

    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await requestOtp(normalizedEmail);

      setOtpEmail(normalizedEmail);
      setCode("");
      setSecondsLeft(Math.max(0, Number(data.expiresIn) || 0));
      setOtpStep("code");
    } catch (err) {
      const retryAfter = Number(err.response?.data?.retryAfter);

      if (retryAfter > 0) {
        setSecondsLeft(retryAfter);
        setOtpStep("code");
      }

      setError(getErrorMessage(err, "Không thể gửi mã xác nhận."));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    await sendCode();
  };

  // XÁC THỰC OTP
  const handleCodeSubmit = async (e) => {
    e.preventDefault();

    if (loading || success) return;

    if (!/^\d{6}$/.test(code)) {
      setError("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    if (secondsLeft <= 0) {
      setError("Mã xác nhận đã hết hạn.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await verifyOtp({
        email: otpEmail.trim(),
        code,
      });

      handleLoginSuccess(data);
    } catch (err) {
      setError(getErrorMessage(err, "Xác thực OTP thất bại."));
    } finally {
      setLoading(false);
    }
  };

  // Nhập mã OTP chỉ gồm chữ số
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);

    setCode(value);
    setError("");
  };

  const handleBackToEmail = () => {
    if (loading || success) return;

    setOtpStep("email");
    setCode("");
    setSecondsLeft(0);
    setError("");
  };

  const isOtpMethod = method === "otp";
  const isCodeStep = isOtpMethod && otpStep === "code";
  const isExpired = isCodeStep && secondsLeft === 0;

  return (
    <main className="sy-travel-login">
      <aside className="sy-travel-visual">
        <Link to="/" className="sy-travel-logo">
          <Compass size={25} />
          <span>
            SeeYAHH!<small>THE ART OF TRAVEL</small>
          </span>
        </Link>
        <div className="sy-travel-story">
          <span className="sy-travel-kicker">
            <Sparkles size={15} /> KHỞI ĐẦU HÀNH TRÌNH
          </span>
          <h2>
            Đi xa hơn.
            <br />
            <em>
              Chạm vào
              <br />
              những điều tuyệt vời.
            </em>
          </h2>
          <p>
            Từ những bờ biển xanh đến những kỳ nghỉ đáng nhớ, thế giới đang chờ
            bạn khám phá.
          </p>
          <div className="sy-travel-tags">
            <span>Khám phá</span>
            <span>Nghỉ dưỡng</span>
            <span>Trải nghiệm</span>
          </div>
        </div>
        <span className="sy-travel-credit">
          SeeYAHH! · Every journey tells a story.
        </span>
      </aside>
      <section className="sy-travel-panel">
        <div className="sy-travel-shell">
          <Link to="/" className="sy-travel-back">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
          <div className="sy-travel-card">
            <div className="sy-travel-icon">
              <Mail size={24} />
            </div>
            <span className="sy-travel-eyebrow">YOUR NEXT ESCAPE</span>
            <h1>{isCodeStep ? "Xác nhận email" : "Chào mừng trở lại."}</h1>
            <p className="sy-travel-intro">
              {isCodeStep ? (
                <>
                  Nhập mã xác nhận đã gửi đến <strong>{otpEmail}</strong>.
                </>
              ) : (
                "Đăng nhập hoặc bắt đầu hành trình của bạn cùng SeeYAHH!"
              )}
            </p>

            {/* THÔNG BÁO LỖI */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {/* THÔNG BÁO THÀNH CÔNG */}
            {success && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600"
              >
                {success}
              </div>
            )}

            {/* ĐĂNG NHẬP BẰNG EMAIL OTP */}
            {isOtpMethod && !isCodeStep && (
              <form onSubmit={handleEmailSubmit} className="sy-travel-form">
                <div>
                  <label
                    htmlFor="otp-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>

                  <input
                    id="otp-email"
                    type="email"
                    value={otpEmail}
                    onChange={(e) => {
                      setOtpEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Nhập email nhận OTP"
                    autoComplete="email"
                    className={inputClass}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || Boolean(success)}
                  className={primaryButtonClass}
                >
                  {loading ? "Đang gửi mã..." : "Gửi mã xác nhận"}{" "}
                  {!loading && <ArrowRight size={17} aria-hidden="true" />}
                </button>
              </form>
            )}

            {/* NHẬP MÃ OTP */}
            {isCodeStep && (
              <>
                <form onSubmit={handleCodeSubmit} className="sy-travel-form">
                  <div>
                    <label
                      htmlFor="otp-code"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Mã xác nhận 6 chữ số
                    </label>

                    <input
                      id="otp-code"
                      name="code"
                      value={code}
                      onChange={handleCodeChange}
                      placeholder="------"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={OTP_LENGTH}
                      autoFocus
                      className={`${inputClass} text-center text-xl font-semibold tracking-[0.5em]`}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || isExpired || Boolean(success)}
                    className={primaryButtonClass}
                  >
                    {loading ? "Đang xác nhận..." : "Xác nhận và đăng nhập"}
                  </button>
                </form>

                <div className="mt-6 space-y-3 text-center text-sm text-slate-500">
                  {isExpired ? (
                    <p>
                      Mã đã hết hạn.{" "}
                      <button
                        type="button"
                        onClick={sendCode}
                        disabled={loading || Boolean(success)}
                        className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60"
                      >
                        Gửi lại mã
                      </button>
                    </p>
                  ) : (
                    <p>
                      Có thể yêu cầu mã mới sau{" "}
                      <span className="font-semibold text-slate-700">
                        {secondsLeft}
                      </span>{" "}
                      giây
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    disabled={loading || Boolean(success)}
                    className="font-medium text-slate-600 hover:text-blue-600 disabled:opacity-60"
                  >
                    Đổi email khác
                  </button>
                </div>
              </>
            )}

            {/* GOOGLE / FACEBOOK */}
            {!isCodeStep && (
              <>
                <div className="sy-travel-divider flex items-center gap-3 text-xs text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  hoặc tiếp tục với
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <SocialLoginButtons
                  onSuccess={handleLoginSuccess}
                  onError={(message) => {
                    setError(
                      typeof message === "string"
                        ? message
                        : "Đăng nhập mạng xã hội thất bại.",
                    );
                  }}
                  disabled={loading || Boolean(success)}
                />
              </>
            )}

            <div className="sy-travel-secure">
              <ShieldCheck size={17} />
              <span>
                Đăng nhập an toàn bằng mã xác nhận hoặc tài khoản liên kết.
              </span>
            </div>
          </div>
          <p className="sy-travel-footer">
            © 2026 SeeYAHH! · Premium travel experience
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
