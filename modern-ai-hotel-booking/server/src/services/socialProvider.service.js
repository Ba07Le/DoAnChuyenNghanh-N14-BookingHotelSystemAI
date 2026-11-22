import { OAuth2Client } from "google-auth-library";
import { httpError } from "../utils/httpError.js";

const GRAPH_API_URL = "https://graph.facebook.com";

let googleClient;

/**
 * Xác thực Google ID token (credential) do Google Identity Services trả về ở client.
 * Trả về hồ sơ chuẩn hoá: { providerId, email, emailVerified, fullName, avatar }.
 */
export const verifyGoogleCredential = async (credential) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw httpError(503, "Đăng nhập Google chưa được cấu hình trên máy chủ.");

  googleClient ??= new OAuth2Client(clientId);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    throw httpError(401, "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.");
  }

  if (!payload?.sub) throw httpError(401, "Không đọc được thông tin tài khoản Google.");

  return {
    providerId: payload.sub,
    email: payload.email ? payload.email.toLowerCase() : "",
    emailVerified: payload.email_verified === true,
    fullName: payload.name || "",
    avatar: payload.picture || "",
  };
};

const fetchGraph = async (path) => {
  try {
    const response = await fetch(`${GRAPH_API_URL}${path}`, { signal: AbortSignal.timeout(8000) });
    return await response.json();
  } catch {
    throw httpError(502, "Không kết nối được tới Facebook. Vui lòng thử lại.");
  }
};

/**
 * Xác thực access token của Facebook Login:
 * 1) debug_token: token còn hạn và được cấp đúng cho ứng dụng của nhóm
 * 2) /me: lấy id, tên, email, ảnh đại diện
 */
export const verifyFacebookToken = async (accessToken) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) throw httpError(503, "Đăng nhập Facebook chưa được cấu hình trên máy chủ.");

  const token = encodeURIComponent(accessToken);

  const debug = await fetchGraph(`/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`);
  if (!debug?.data?.is_valid || String(debug.data.app_id) !== String(appId)) {
    throw httpError(401, "Phiên đăng nhập Facebook không hợp lệ hoặc đã hết hạn.");
  }

  const me = await fetchGraph(`/me?fields=id,name,email,picture.type(large)&access_token=${token}`);
  if (!me?.id) throw httpError(401, "Không đọc được thông tin tài khoản Facebook.");

  return {
    providerId: String(me.id),
    email: me.email ? me.email.toLowerCase() : "",
    // Facebook không đảm bảo email đã được xác minh nên không coi là "verified"
    emailVerified: false,
    fullName: me.name || "",
    avatar: me.picture?.data?.url || "",
  };
};
