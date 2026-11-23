import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:5001/api", headers: { "Content-Type": "application/json" } });
api.interceptors.request.use((config) => { const token = localStorage.getItem("token"); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });

// [ADMIN] Token hết hạn hoặc tài khoản bị khoá -> backend trả 401: xoá phiên và về trang đăng nhập.
// Bỏ qua /auth/* vì đăng nhập sai mật khẩu cũng trả 401 và cần hiện lỗi tại form.
api.interceptors.response.use((res) => res, (error) => {
  const url = error.config?.url || "";
  if (error.response?.status === 401 && !url.startsWith("/auth/") && localStorage.getItem("token")) {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    if (!location.pathname.startsWith("/login")) location.assign("/login");
  }
  return Promise.reject(error);
});
export default api;