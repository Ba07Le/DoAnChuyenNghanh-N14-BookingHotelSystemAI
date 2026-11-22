import { useCallback, useEffect, useRef, useState } from "react";
import { loginWithFacebook, loginWithGoogle } from "../api/authApi";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const FACEBOOK_SCRIPT_URL = "https://connect.facebook.net/vi_VN/sdk.js";
const FACEBOOK_API_VERSION = "v23.0";

const socialButtonClass =
  "flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

let facebookInitialized = false;

const loadScript = (id, src) =>
  new Promise((resolve, reject) => {
    const existing = document.getElementById(id);

    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.4 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.96h-1.52c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.09 24 12.07z"
      />
    </svg>
  );
}

/**
 * Nút đăng nhập bằng Google và Facebook.
 * onSuccess(data): nhận { token, user, message }; onError(message): nhận thông báo lỗi.
 */
function SocialLoginButtons({ onSuccess, onError, disabled = false }) {
  const googleButtonRef = useRef(null);
  const [facebookReady, setFacebookReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // Luôn gọi callback mới nhất bên trong các SDK của Google / Facebook
  const handlers = useRef({ onSuccess, onError });
  useEffect(() => {
    handlers.current = { onSuccess, onError };
  });

  const authenticate = useCallback(async (request) => {
    setBusy(true);

    try {
      handlers.current.onSuccess(await request());
    } catch (error) {
      handlers.current.onError(
        error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  // Google Identity Services: Google tự vẽ nút và trả về ID token (credential)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let cancelled = false;

    loadScript("google-identity", GOOGLE_SCRIPT_URL)
      .then(() => {
        if (cancelled || !googleButtonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => authenticate(() => loginWithGoogle(credential)),
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          locale: "vi",
          width: Math.min(Math.max(googleButtonRef.current.offsetWidth, 200), 400),
        });
      })
      .catch(() => handlers.current.onError("Không tải được Google. Vui lòng kiểm tra kết nối mạng."));

    return () => {
      cancelled = true;
    };
  }, [authenticate]);

  // Facebook JS SDK
  useEffect(() => {
    if (!FACEBOOK_APP_ID) return;

    loadScript("facebook-sdk", FACEBOOK_SCRIPT_URL)
      .then(() => {
        if (!facebookInitialized) {
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: false,
            xfbml: false,
            version: FACEBOOK_API_VERSION,
          });
          facebookInitialized = true;
        }
        setFacebookReady(true);
      })
      .catch(() => handlers.current.onError("Không tải được Facebook. Vui lòng kiểm tra kết nối mạng."));
  }, []);

  // FB.login phải được gọi trực tiếp trong sự kiện click để trình duyệt không chặn cửa sổ đăng nhập
  const handleFacebookClick = () => {
    if (!FACEBOOK_APP_ID) {
      return onError("Chưa cấu hình Facebook: hãy điền VITE_FACEBOOK_APP_ID trong client/.env.");
    }

    window.FB.login(
      (response) => {
        const accessToken = response.authResponse?.accessToken;
        if (!accessToken) return handlers.current.onError("Bạn đã huỷ đăng nhập Facebook.");

        authenticate(() => loginWithFacebook(accessToken));
      },
      { scope: "public_profile,email" },
    );
  };

  const blocked = disabled || busy;

  return (
    <div className="space-y-3">
      {GOOGLE_CLIENT_ID ? (
        <div
          ref={googleButtonRef}
          className={`flex min-h-11 justify-center ${blocked ? "pointer-events-none opacity-60" : ""}`}
        />
      ) : (
        <button
          type="button"
          onClick={() => onError("Chưa cấu hình Google: hãy điền VITE_GOOGLE_CLIENT_ID trong client/.env.")}
          className={socialButtonClass}
        >
          <GoogleIcon />
          Tiếp tục với Google
        </button>
      )}

      <button
        type="button"
        onClick={handleFacebookClick}
        disabled={blocked || (Boolean(FACEBOOK_APP_ID) && !facebookReady)}
        className={socialButtonClass}
      >
        <FacebookIcon />
        Tiếp tục với Facebook
      </button>
    </div>
  );
}

export default SocialLoginButtons;
