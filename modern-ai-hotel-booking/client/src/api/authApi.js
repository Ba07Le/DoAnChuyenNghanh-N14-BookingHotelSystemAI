import api from "./apiClient";

// ==========================================
// ĐĂNG KÝ / ĐĂNG NHẬP TRUYỀN THỐNG
// ==========================================

// Đăng ký tài khoản
export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

// Đăng nhập bằng email và mật khẩu
export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

// Lấy thông tin tài khoản hiện tại
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// ==========================================
// ĐĂNG NHẬP BẰNG EMAIL OTP
// ==========================================

// Gửi mã OTP 6 chữ số qua email
export const requestOtp = async (email) => {
  const response = await api.post("/auth/otp/request", {
    email,
  });

  return response.data;
};

// Xác thực mã OTP và đăng nhập
export const verifyOtp = async ({ email, code }) => {
  const response = await api.post("/auth/otp/verify", {
    email,
    code,
  });

  return response.data;
};

// ==========================================
// ĐĂNG NHẬP BẰNG GOOGLE / FACEBOOK
// ==========================================

// Google Identity Services trả về ID token
export const loginWithGoogle = async (credential) => {
  const response = await api.post("/auth/google", {
    credential,
  });

  return response.data;
};

// Facebook SDK trả về access token
export const loginWithFacebook = async (accessToken) => {
  const response = await api.post("/auth/facebook", {
    accessToken,
  });

  return response.data;
};

// ==========================================
// ĐĂNG NHẬP DÀNH CHO NHÂN VIÊN
// ==========================================

// Giữ nguyên giao diện gọi hàm staffLogin(email, password)
export const staffLogin = async (email, password) => {
  const response = await api.post("/auth/staff/login", {
    email,
    password,
  });

  return response.data;
};
