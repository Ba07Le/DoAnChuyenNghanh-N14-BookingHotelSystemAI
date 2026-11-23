import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ.");
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có dạng YYYY-MM-DD.");
const paging = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};
const search = z.string().trim().max(100).optional();
const reason = z.string().trim().min(5, "Vui lòng nhập lý do (tối thiểu 5 ký tự).").max(500);

export const idParam = z.object({ id: objectId });

// ---- Users
export const userListQuery = z.object({
  ...paging, search,
  role: z.enum(["CUSTOMER", "HOTEL_OWNER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
});
export const userStatusBody = z.object({ status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]), reason: z.string().trim().max(300).optional() });
export const userRoleBody = z.object({ role: z.enum(["CUSTOMER", "HOTEL_OWNER", "ADMIN"]) });

// ---- Hotels
export const hotelListQuery = z.object({
  ...paging, search,
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
});
export const hotelRejectBody = z.object({ reason });
export const hotelStatusBody = z.object({ status: z.enum(["APPROVED", "SUSPENDED"]) });

// ---- Bookings
export const bookingListQuery = z.object({
  ...paging, search,
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED"]).optional(),
  hotelId: objectId.optional(),
  from: day.optional(), to: day.optional(),
});
export const bookingCancelBody = z.object({ reason });

// ---- Dashboard / analytics
export const rangeQuery = z.object({
  from: day.optional(), to: day.optional(),
  groupBy: z.enum(["day", "month"]).default("day"),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

// ---- Audit logs
export const auditListQuery = z.object({
  ...paging,
  entity: z.string().trim().max(50).optional(),
  action: z.string().trim().max(80).optional(),
  actorId: objectId.optional(),
  from: day.optional(), to: day.optional(),
});

// ---- Coupons (mã giảm giá)
// Các trường KHÔNG có default: schema cập nhật dùng lại để PATCH một phần không ghi đè dữ liệu cũ bằng giá trị mặc định
const couponFields = {
  title: z.string().trim().min(3, "Tiêu đề tối thiểu 3 ký tự.").max(120),
  description: z.string().trim().max(500),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive("Giá trị giảm phải lớn hơn 0."),
  minBookingAmount: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().min(0), // 0 = không giới hạn
  usageLimit: z.coerce.number().int().min(0), // 0 = không giới hạn
  startDate: day, endDate: day,
  featured: z.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
};
const couponRules = (d, ctx) => {
  if (d.discountType === "PERCENTAGE" && d.discountValue > 100)
    ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Giảm theo % không được vượt quá 100." });
  if (d.startDate && d.endDate && d.startDate > d.endDate)
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu." });
};
export const couponCreateBody = z.object({
  ...couponFields,
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,20}$/, "Mã gồm 3–20 ký tự: chữ, số, gạch ngang hoặc gạch dưới."),
  description: couponFields.description.default(""),
  minBookingAmount: couponFields.minBookingAmount.default(0),
  maxDiscount: couponFields.maxDiscount.default(0),
  usageLimit: couponFields.usageLimit.default(0),
  featured: couponFields.featured.default(false),
  status: couponFields.status.default("ACTIVE"),
}).superRefine(couponRules);
// Không cho đổi `code` vì mã đã phát cho khách
export const couponUpdateBody = z.object(couponFields).partial().superRefine(couponRules);
export const couponStatusBody = z.object({ status: couponFields.status });
export const couponListQuery = z.object({
  ...paging, search,
  state: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
});
