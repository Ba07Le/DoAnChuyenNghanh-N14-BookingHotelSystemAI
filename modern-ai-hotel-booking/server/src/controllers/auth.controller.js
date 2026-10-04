import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, phone } = req.body;

    // 1. Kiểm tra dữ liệu
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin.",
      });
    }

    // 2. Kiểm tra password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu xác nhận không khớp.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    // 3. Chuẩn hóa email
    const normalizedEmail = email.toLowerCase().trim();

    // 4. Kiểm tra email tồn tại
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được đăng ký.",
      });
    }

    // 5. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 6. Tạo user
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone?.trim() || "",
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: false,
      preferences: {
        language: "vi",
        currency: "VND",
      },
    });

    // 7. Không trả passwordHash về frontend
    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    // Duplicate email từ MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được đăng ký.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi đăng ký.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra dữ liệu
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email và mật khẩu.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Tìm user theo email
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    // 3. Kiểm tra trạng thái tài khoản
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn hiện không thể đăng nhập.",
      });
    }

    // 4. Kiểm tra password
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    // 5. Tạo JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // 6. Đăng nhập thành công
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi đăng nhập.",
    });
  }
};
