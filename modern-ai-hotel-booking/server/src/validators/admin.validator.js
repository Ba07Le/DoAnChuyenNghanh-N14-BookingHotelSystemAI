import { z } from "zod";

// =====================================
// COMMON VALIDATORS
// =====================================

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ.");

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có dạng YYYY-MM-DD.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Ngày không hợp lệ.");

const paging = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

const search = z.string().trim().max(100).optional();

const reason = z
  .string()
  .trim()
  .min(5, "Vui lòng nhập lý do (tối thiểu 5 ký tự).")
  .max(500);

// Kiểm tra khoảng thời gian
const checkDateRange = (data, ctx) => {
  if (data.from && data.to && data.from > data.to) {
    ctx.addIssue({
      code: "custom",
      path: ["to"],
      message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
    });
  }
};

// =====================================
// ID PARAM
// =====================================

export const idParam = z.object({
  id: objectId,
});

// =====================================
// USERS
// =====================================

export const userListQuery = z.object({
  ...paging,
  search,

  role: z.enum(["CUSTOMER", "HOTEL_OWNER", "ADMIN"]).optional(),

  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
});

export const userStatusBody = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),

  reason: z.string().trim().max(300).optional(),
});

export const userRoleBody = z.object({
  role: z.enum(["CUSTOMER", "HOTEL_OWNER", "ADMIN"]),
});

// =====================================
// HOTELS
// =====================================

export const hotelListQuery = z.object({
  ...paging,
  search,

  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED"])
    .optional(),
});

export const hotelRejectBody = z.object({
  reason,
});

export const hotelStatusBody = z.object({
  status: z.enum(["APPROVED", "SUSPENDED"]),
});

// =====================================
// BOOKINGS
// =====================================

export const bookingListQuery = z
  .object({
    ...paging,
    search,

    status: z
      .enum([
        "PENDING",
        "PENDING_PAYMENT",
        "CONFIRMED",
        "CHECKED_IN",
        "COMPLETED",
        "CANCELLED",
      ])
      .optional(),

    paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED"]).optional(),

    hotelId: objectId.optional(),

    from: day.optional(),
    to: day.optional(),
  })
  .superRefine(checkDateRange);

export const bookingCancelBody = z.object({
  reason,
});

// =====================================
// DASHBOARD / ANALYTICS
// =====================================

export const rangeQuery = z
  .object({
    from: day.optional(),
    to: day.optional(),

    groupBy: z.enum(["day", "month"]).default("day"),

    limit: z.coerce.number().int().min(1).max(20).default(5),
  })
  .superRefine(checkDateRange);

// =====================================
// AUDIT LOGS
// =====================================

export const auditListQuery = z
  .object({
    ...paging,

    entity: z.string().trim().max(50).optional(),

    action: z.string().trim().max(80).optional(),

    actorId: objectId.optional(),

    from: day.optional(),
    to: day.optional(),
  })
  .superRefine(checkDateRange);

// =====================================
// COUPONS
// =====================================

// Không đặt default tại couponFields
// để PATCH không ghi đè dữ liệu cũ.

const couponFields = {
  title: z.string().trim().min(3, "Tiêu đề tối thiểu 3 ký tự.").max(120),

  description: z.string().trim().max(500),

  discountType: z.enum(["PERCENTAGE", "FIXED"]),

  discountValue: z.coerce.number().positive("Giá trị giảm phải lớn hơn 0."),

  minBookingAmount: z.coerce.number().min(0),

  maxDiscount: z.coerce.number().min(0),

  usageLimit: z.coerce.number().int().min(0),

  startDate: day,

  endDate: day,

  featured: z.boolean(),

  status: z.enum(["ACTIVE", "INACTIVE"]),
};

// Kiểm tra quy tắc Coupon
const couponRules = (data, ctx) => {
  if (
    data.discountType === "PERCENTAGE" &&
    data.discountValue !== undefined &&
    data.discountValue > 100
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["discountValue"],
      message: "Giảm theo % không được vượt quá 100.",
    });
  }

  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
    });
  }
};

// =====================================
// CREATE COUPON
// =====================================

export const couponCreateBody = z
  .object({
    ...couponFields,

    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z0-9_-]{3,20}$/,
        "Mã gồm 3–20 ký tự: chữ, số, gạch ngang hoặc gạch dưới.",
      ),

    description: couponFields.description.default(""),

    minBookingAmount: couponFields.minBookingAmount.default(0),

    maxDiscount: couponFields.maxDiscount.default(0),

    usageLimit: couponFields.usageLimit.default(0),

    featured: couponFields.featured.default(false),

    status: couponFields.status.default("ACTIVE"),
  })
  .superRefine(couponRules);

// =====================================
// UPDATE COUPON
// =====================================

// Cho phép PATCH từng trường.
// Không cho sửa code Coupon đã phát hành.
export const couponUpdateBody = z
  .object(couponFields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Cần cung cấp ít nhất một trường để cập nhật.",
  )
  .superRefine(couponRules);

// =====================================
// UPDATE COUPON STATUS
// =====================================

export const couponStatusBody = z.object({
  status: couponFields.status,
});

// =====================================
// LIST COUPONS
// =====================================

export const couponListQuery = z.object({
  ...paging,
  search,

  state: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
});
