import express from "express";

import { authenticate, authorize } from "../middleware/auth.js";

import { validate } from "../middleware/validate.js";

import * as v from "../validators/admin.validator.js";

import * as users from "../controllers/admin/adminUser.controller.js";
import * as hotels from "../controllers/admin/adminHotel.controller.js";
import * as bookings from "../controllers/admin/adminBooking.controller.js";
import * as dash from "../controllers/admin/adminDashboard.controller.js";
import * as coupons from "../controllers/admin/adminCoupon.controller.js";

const r = express.Router();

// =====================================
// BẢO VỆ TOÀN BỘ ADMIN API
// =====================================
// Chưa đăng nhập: 401
// Không có quyền ADMIN: 403
r.use(authenticate, authorize("ADMIN"));

// Validate MongoDB ObjectId
const id = validate(v.idParam, "params");

// Validate query thời gian cho Dashboard
const range = validate(v.rangeQuery, "query");

// =====================================
// USERS MANAGEMENT
// =====================================

// Danh sách tài khoản
r.get("/users", validate(v.userListQuery, "query"), users.list);

// Chi tiết tài khoản
r.get("/users/:id", id, users.detail);

// Cập nhật trạng thái tài khoản
r.patch(
  "/users/:id/status",
  id,
  validate(v.userStatusBody, "body"),
  users.setStatus,
);

// Cập nhật vai trò tài khoản
r.patch("/users/:id/role", id, validate(v.userRoleBody, "body"), users.setRole);

// =====================================
// HOTELS MANAGEMENT
// =====================================

// Danh sách khách sạn
r.get("/hotels", validate(v.hotelListQuery, "query"), hotels.list);

// Chi tiết khách sạn
r.get("/hotels/:id", id, hotels.detail);

// Phê duyệt khách sạn
r.patch("/hotels/:id/approve", id, hotels.approve);

// Từ chối khách sạn
r.patch(
  "/hotels/:id/reject",
  id,
  validate(v.hotelRejectBody, "body"),
  hotels.reject,
);

// Cập nhật trạng thái khách sạn
r.patch(
  "/hotels/:id/status",
  id,
  validate(v.hotelStatusBody, "body"),
  hotels.setStatus,
);

// =====================================
// BOOKINGS MANAGEMENT
// =====================================

// Danh sách đặt phòng
r.get("/bookings", validate(v.bookingListQuery, "query"), bookings.list);

// Chi tiết đặt phòng
r.get("/bookings/:id", id, bookings.detail);

// Admin hủy đặt phòng
r.patch(
  "/bookings/:id/cancel",
  id,
  validate(v.bookingCancelBody, "body"),
  bookings.cancel,
);

// =====================================
// COUPONS MANAGEMENT
// =====================================

// Danh sách mã giảm giá
r.get("/coupons", validate(v.couponListQuery, "query"), coupons.list);

// Tạo mã giảm giá
r.post("/coupons", validate(v.couponCreateBody, "body"), coupons.create);

// Cập nhật mã giảm giá
r.patch(
  "/coupons/:id",
  id,
  validate(v.couponUpdateBody, "body"),
  coupons.update,
);

// Thay đổi trạng thái Coupon
r.patch(
  "/coupons/:id/status",
  id,
  validate(v.couponStatusBody, "body"),
  coupons.setStatus,
);

// Xóa mã giảm giá
r.delete("/coupons/:id", id, coupons.remove);

// =====================================
// ADMIN DASHBOARD
// =====================================

// Thống kê tổng quan
r.get("/dashboard/overview", range, dash.overview);

// AI Insights
r.get("/dashboard/ai-insights", dash.aiInsights);

// =====================================
// ANALYTICS
// =====================================

// Doanh thu
r.get("/analytics/revenue", range, dash.revenue);

// Thống kê trạng thái Booking
r.get("/analytics/bookings-by-status", range, dash.bookingsByStatus);

// Top khách sạn
r.get("/analytics/top-hotels", range, dash.topHotels);

// Thống kê khách hàng
r.get("/analytics/customers", range, dash.customers);

// Tỷ lệ hủy đặt phòng
r.get("/analytics/cancellation-rate", range, dash.cancellation);

// =====================================
// AUDIT LOGS
// =====================================

// Lịch sử hoạt động quản trị
r.get("/audit-logs", validate(v.auditListQuery, "query"), dash.auditLogs);

export default r;
