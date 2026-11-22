import express from "express";

import {
  allBookings,
  cancelBooking,
  createBooking,
  getBooking,
  lookupBooking,
  markPaid,
  myBookings,
  quoteBooking,
} from "../controllers/booking.controller.js";

import {
  authenticate,
  authorize,
  optionalAuthenticate,
} from "../middleware/auth.js";

import { bookingLimiter, lookupLimiter } from "../middleware/rateLimiter.js";

import { validate, validateQuery } from "../middleware/validate.js";

import {
  createBookingSchema,
  lookupQuerySchema,
  quoteQuerySchema,
} from "../utils/bookingValidators.js";

const router = express.Router();

// CÁC API CÔNG KHAI

// Xem giá, tồn phòng và ưu đãi
router.get("/quote", validateQuery(quoteQuerySchema), quoteBooking);

// Khách vãng lai tra cứu booking
router.get(
  "/lookup",
  lookupLimiter,
  validateQuery(lookupQuerySchema),
  lookupBooking,
);

// Tạo booking khi đăng nhập hoặc chưa đăng nhập
router.post(
  "/",
  optionalAuthenticate,
  bookingLimiter,
  validate(createBookingSchema),
  createBooking,
);

// CÁC API YÊU CẦU ĐĂNG NHẬP
router.use(authenticate);

// Danh sách booking cá nhân
router.get("/my", myBookings);

// Admin xem tất cả booking
router.get("/admin/all", authorize("ADMIN"), allBookings);

// Xem chi tiết booking
router.get("/:id", getBooking);

// Thanh toán demo - chỉ Admin
router.post("/:id/pay", authorize("ADMIN"), markPaid);

// Hủy booking
router.post("/:id/cancel", cancelBooking);

export default router;
