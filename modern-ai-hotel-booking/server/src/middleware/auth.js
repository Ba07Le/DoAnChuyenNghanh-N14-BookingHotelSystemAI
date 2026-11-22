import jwt from "jsonwebtoken";
import User from "../models/User.js";

const unauthorized = (res, message) => {
  return res.status(401).json({
    success: false,
    message,
  });
};

// Xác thực người dùng bắt buộc đăng nhập
export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";

    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

    if (!token) {
      return unauthorized(res, "Vui lòng đăng nhập.");
    }

    // Giữ tương thích với JWT hiện tại
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload.userId) {
      return unauthorized(res, "Token không hợp lệ.");
    }

    // Lấy thông tin tài khoản từ MongoDB
    const user = await User.findById(payload.userId)
      .select("+tokenVersion -passwordHash")
      .lean();

    if (!user || user.status !== "ACTIVE") {
      return unauthorized(res, "Phiên đăng nhập không còn hợp lệ.");
    }

    // Token mới có tokenVersion thì kiểm tra phiên bản
    if (payload.tokenVersion !== undefined) {
      const currentVersion = user.tokenVersion ?? 0;

      if (currentVersion !== payload.tokenVersion) {
        return unauthorized(
          res,
          "Phiên đăng nhập đã bị vô hiệu hóa. Vui lòng đăng nhập lại.",
        );
      }
    }

    // Không đưa dữ liệu nhạy cảm vào req.user
    const { passwordHash, tokenVersion, ...profile } = user;

    req.user = profile;

    next();
  } catch (error) {
    return unauthorized(res, "Token không hợp lệ hoặc đã hết hạn.");
  }
};

// Cho phép cả người chưa đăng nhập truy cập
export const optionalAuthenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return next();
  }

  return authenticate(req, res, next);
};

// Phân quyền theo vai trò
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, "Vui lòng đăng nhập.");
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác này.",
      });
    }

    next();
  };
};
