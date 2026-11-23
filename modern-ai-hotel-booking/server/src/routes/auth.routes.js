import express from "express";

import {
  me,
  requestOtp,
  verifyOtp,
  staffLogin,
  googleLogin,
  facebookLogin,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.js";

import {
  authLimiter,
  otpRequestLimiter,
  staffLoginLimiter,
} from "../middleware/rateLimiter.js";

import { validate } from "../middleware/validate.js";

import {
  facebookSchema,
  googleSchema,
  otpRequestSchema,
  otpVerifySchema,
  staffLoginSchema,
} from "../utils/authValidators.js";

const router = express.Router();

// Customer chỉ dùng OTP/Google/Facebook; Admin/Owner dùng /manager/login.

// Đăng nhập bằng Email OTP
router.post(
  "/otp/request",
  otpRequestLimiter,
  validate(otpRequestSchema),
  requestOtp,
);

router.post("/otp/verify", authLimiter, validate(otpVerifySchema), verifyOtp);

// Đăng nhập dành cho nhân viên và quản lý
router.post(
  "/staff/login",
  staffLoginLimiter,
  validate(staffLoginSchema),
  staffLogin,
);

router.post(
  "/manager/login",
  staffLoginLimiter,
  validate(staffLoginSchema),
  staffLogin,
);

// Đăng nhập bằng Google
router.post("/google", authLimiter, validate(googleSchema), googleLogin);

// Đăng nhập bằng Facebook
router.post("/facebook", authLimiter, validate(facebookSchema), facebookLogin);

// Lấy thông tin người dùng hiện tại
router.get("/me", authenticate, me);

export default router;
