import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import * as authService from "../services/auth.service.js";
import * as otpService from "../services/otp.service.js";

// Dữ liệu người dùng được phép trả về Frontend
const safe = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  status: user.status,
  emailVerified: user.emailVerified,
});

// ĐĂNG KÝ BẰNG MẬT KHẨU - GIỮ CHỨC NĂNG CŨ
export const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      phone = "",
    } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin bắt buộc.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu xác nhận không khớp.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Thông tin đăng ký không hợp lệ.",
      });
    }

    const normalized = email.trim().toLowerCase();

    if (await User.findOne({ email: normalized })) {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng.",
      });
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalized,
      passwordHash: await bcrypt.hash(password, 12),
      phone: phone.trim(),
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: false,
      tokenVersion: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      user: safe(user),
    });
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Không thể đăng ký tài khoản.",
    });
  }
};

// ĐĂNG NHẬP BẰNG MẬT KHẨU - GIỮ CHỨC NĂNG CŨ
export const login = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body?.password;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email và mật khẩu.",
      });
    }

    // passwordHash bị ẩn trong User.js nên phải lấy rõ ràng
    const user = await User.findOne({ email }).select(
      "+passwordHash +tokenVersion",
    );

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản hiện không thể đăng nhập.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        tokenVersion: user.tokenVersion ?? 0,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } },
    );

    return res.json({
      success: true,
      message: "Đăng nhập thành công.",
      token,
      user: safe(user),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể đăng nhập.",
    });
  }
};

// GỬI OTP EMAIL
export const requestOtp = async (req, res) => {
  const { expiresIn } = await otpService.requestOtp(req.body.email);

  return res.json({
    success: true,
    message: "Nếu email hợp lệ, mã xác nhận sẽ được gửi đến hộp thư của bạn.",
    expiresIn,
  });
};

// XÁC THỰC OTP VÀ ĐĂNG NHẬP
export const verifyOtp = async (req, res) => {
  const session = await authService.loginWithEmailOtp(
    req.body.email,
    req.body.code,
  );

  return res.json({
    success: true,
    message: "Đăng nhập thành công.",
    ...session,
  });
};

// ĐĂNG NHẬP STAFF / MANAGER
export const staffLogin = async (req, res) => {
  const session = await authService.loginStaff(
    req.body.email,
    req.body.password,
  );

  return res.json({
    success: true,
    message: "Đăng nhập thành công.",
    ...session,
  });
};

// ĐĂNG NHẬP GOOGLE
export const googleLogin = async (req, res) => {
  const session = await authService.loginWithGoogle(req.body.credential);

  return res.json({
    success: true,
    message: "Đăng nhập bằng Google thành công.",
    ...session,
  });
};

// ĐĂNG NHẬP FACEBOOK
export const facebookLogin = async (req, res) => {
  const session = await authService.loginWithFacebook(req.body.accessToken);

  return res.json({
    success: true,
    message: "Đăng nhập bằng Facebook thành công.",
    ...session,
  });
};

// LẤY THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
export const me = (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};
