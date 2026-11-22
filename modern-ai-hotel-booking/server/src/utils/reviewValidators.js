import { z } from "zod";

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const rating = z
  .number({ error: "Vui lòng chọn số sao." })
  .int("Số sao không hợp lệ.")
  .min(1, "Số sao tối thiểu là 1.")
  .max(5, "Số sao tối đa là 5.");

const title = z.string({ error: "Tiêu đề không hợp lệ." }).trim().max(100, "Tiêu đề tối đa 100 ký tự.");

const comment = z.string({ error: "Nhận xét không hợp lệ." }).trim().max(2000, "Nhận xét tối đa 2000 ký tự.");

const images = z
  .array(
    z.string().refine(
      (url) => /^https?:\/\/\S+$/i.test(url) || url.startsWith("/uploads/") || url.startsWith("data:image/"),
      "Đường dẫn ảnh không hợp lệ.",
    ),
    { error: "Danh sách ảnh không hợp lệ." },
  )
  .max(5, "Tối đa 5 ảnh.");

// Người dùng chỉ được gửi các trường này; status, hotelResponse, aiAnalysis bị bỏ qua
export const createReviewSchema = z.object({
  bookingId: z
    .string({ error: "Thiếu mã đặt phòng." })
    .refine((value) => OBJECT_ID_PATTERN.test(value), "Mã đặt phòng không hợp lệ."),
  rating,
  title: title.default(""),
  comment: comment.default(""),
  images: images.default([]),
});

export const updateReviewSchema = z
  .object({ rating, title, comment, images })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Không có thông tin nào để cập nhật.");
