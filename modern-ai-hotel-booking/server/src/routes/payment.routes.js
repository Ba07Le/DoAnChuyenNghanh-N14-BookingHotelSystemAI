import express from "express";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { paymentCreateLimiter, paymentStatusLimiter } from "../middleware/rateLimiter.js";
import {
  createSePayPayment,
  createZaloPayPayment,
  getPaymentStatus,
  sepayIpn,
  zaloPayCallback,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Callback/IPN công khai; mỗi endpoint tự xác thực chữ ký/secret của nhà cung cấp.
router.post("/sepay/ipn", sepayIpn);
router.post("/zalopay/callback", zaloPayCallback);

// Khách đã đăng nhập dùng JWT; khách vãng lai dùng Guest Payment Token được cấp khi tạo booking.
router.post("/sepay/create", optionalAuthenticate, paymentCreateLimiter, createSePayPayment);
router.post("/zalopay/create", optionalAuthenticate, paymentCreateLimiter, createZaloPayPayment);
router.get("/status/:bookingId", optionalAuthenticate, paymentStatusLimiter, getPaymentStatus);

export default router;
