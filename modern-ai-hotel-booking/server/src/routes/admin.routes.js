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
// Toàn bộ /api/admin: chưa đăng nhập -> 401, không phải ADMIN -> 403
r.use(authenticate, authorize("ADMIN"));

const id = validate(v.idParam, "params");

// Users
r.get("/users", validate(v.userListQuery), users.list);
r.get("/users/:id", id, users.detail);
r.patch("/users/:id/status", id, validate(v.userStatusBody, "body"), users.setStatus);
r.patch("/users/:id/role", id, validate(v.userRoleBody, "body"), users.setRole);

// Hotels
r.get("/hotels", validate(v.hotelListQuery), hotels.list);
r.get("/hotels/:id", id, hotels.detail);
r.patch("/hotels/:id/approve", id, hotels.approve);
r.patch("/hotels/:id/reject", id, validate(v.hotelRejectBody, "body"), hotels.reject);
r.patch("/hotels/:id/status", id, validate(v.hotelStatusBody, "body"), hotels.setStatus);

// Bookings (admin chỉ xem + huỷ)
r.get("/bookings", validate(v.bookingListQuery), bookings.list);
r.get("/bookings/:id", id, bookings.detail);
r.patch("/bookings/:id/cancel", id, validate(v.bookingCancelBody, "body"), bookings.cancel);

// Coupons
r.get("/coupons", validate(v.couponListQuery), coupons.list);
r.post("/coupons", validate(v.couponCreateBody, "body"), coupons.create);
r.patch("/coupons/:id", id, validate(v.couponUpdateBody, "body"), coupons.update);
r.patch("/coupons/:id/status", id, validate(v.couponStatusBody, "body"), coupons.setStatus);
r.delete("/coupons/:id", id, coupons.remove);

// Dashboard & analytics
const range = validate(v.rangeQuery);
r.get("/dashboard/overview", range, dash.overview);
r.get("/dashboard/ai-insights", dash.aiInsights);
r.get("/analytics/revenue", range, dash.revenue);
r.get("/analytics/bookings-by-status", range, dash.bookingsByStatus);
r.get("/analytics/top-hotels", range, dash.topHotels);
r.get("/analytics/customers", range, dash.customers);
r.get("/analytics/cancellation-rate", range, dash.cancellation);

// Audit logs (chỉ đọc)
r.get("/audit-logs", validate(v.auditListQuery), dash.auditLogs);

export default r;
