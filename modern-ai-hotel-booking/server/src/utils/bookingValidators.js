import { z } from "zod";
import { normalizePhone } from "./userValidators.js";

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_ROOMS = 5;
const MAX_GUESTS = 20;

const objectId = (message) => z.string({ error: message }).refine((value) => OBJECT_ID_PATTERN.test(value), message);

// Ngày dạng YYYY-MM-DD và là ngày có thật (không nhận 2026-02-31)
const dateString = (message) =>
  z.string({ error: message }).refine((value) => {
    if (!DATE_PATTERN.test(value)) return false;

    const date = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, message);

const email = z
  .string({ error: "Vui lòng nhập email." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Email không hợp lệ."));

const couponCode = z
  .string()
  .trim()
  .max(30, "Mã ưu đãi không hợp lệ.")
  .transform((value) => value.toUpperCase())
  .default("");

// Số lượng gửi qua query string (dạng chuỗi) nên cần ép kiểu
const queryCount = (min, max, fallback) =>
  z.coerce
    .number({ error: "Giá trị không hợp lệ." })
    .int("Giá trị không hợp lệ.")
    .min(min, "Giá trị không hợp lệ.")
    .max(max, "Giá trị không hợp lệ.")
    .default(fallback);

const bodyCount = (min, max, fallback, message) =>
  z
    .number({ error: message })
    .int(message)
    .min(min, message)
    .max(max, message)
    .default(fallback);

// Thông tin người nhận phòng sau khi đã gộp với hồ sơ (khách đã đăng nhập) hoặc do khách vãng lai nhập
export const contactSchema = z.object({
  fullName: z
    .string({ error: "Vui lòng nhập họ và tên." })
    .trim()
    .min(2, "Họ và tên tối thiểu 2 ký tự.")
    .max(100, "Họ và tên tối đa 100 ký tự."),
  email,
  phone: z
    .string({ error: "Vui lòng nhập số điện thoại." })
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^0\d{9,10}$/.test(value), "Số điện thoại phải gồm 10–11 chữ số."),
});

// Xem giá và tình trạng phòng trước khi đặt (công khai)
export const quoteQuerySchema = z
  .object({
    hotelId: objectId("Mã khách sạn không hợp lệ."),
    roomTypeId: objectId("Mã loại phòng không hợp lệ."),
    checkIn: dateString("Ngày nhận phòng không hợp lệ.").optional(),
    checkOut: dateString("Ngày trả phòng không hợp lệ.").optional(),
    rooms: queryCount(1, MAX_ROOMS, 1),
    adults: queryCount(1, MAX_GUESTS, 1),
    children: queryCount(0, MAX_GUESTS, 0),
    couponCode,
  })
  .refine((query) => Boolean(query.checkIn) === Boolean(query.checkOut), {
    message: "Vui lòng chọn đầy đủ ngày nhận và trả phòng.",
    path: ["checkOut"],
  });

// Đặt phòng: người đã đăng nhập có thể bỏ trống họ tên, email, số điện thoại (lấy từ hồ sơ)
export const createBookingSchema = z.object({
  hotelId: objectId("Mã khách sạn không hợp lệ."),
  roomTypeId: objectId("Mã loại phòng không hợp lệ."),
  checkIn: dateString("Ngày nhận phòng không hợp lệ."),
  checkOut: dateString("Ngày trả phòng không hợp lệ."),
  rooms: bodyCount(1, MAX_ROOMS, 1, `Số phòng phải từ 1 đến ${MAX_ROOMS}.`),
  adults: bodyCount(1, MAX_GUESTS, 1, "Số người lớn không hợp lệ."),
  children: bodyCount(0, MAX_GUESTS, 0, "Số trẻ em không hợp lệ."),
  couponCode,
  paymentMethod: z.enum(["CASH", "SEPAY", "ZALOPAY"], { error: "Phương thức thanh toán không hợp lệ." }).default("CASH"),
  guestInfo: z
    .object({
      fullName: z.string().trim().max(100, "Họ và tên tối đa 100 ký tự.").optional(),
      email: z.string().trim().max(150, "Email không hợp lệ.").optional(),
      phone: z.string().trim().max(30, "Số điện thoại không hợp lệ.").optional(),
      note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự.").default(""),
    })
    .default({ note: "" }),
});

// Khách vãng lai tra cứu đơn bằng mã đặt phòng và email
export const lookupQuerySchema = z.object({
  code: z
    .string({ error: "Vui lòng nhập mã đặt phòng." })
    .trim()
    .toUpperCase()
    .min(6, "Mã đặt phòng không hợp lệ.")
    .max(40, "Mã đặt phòng không hợp lệ."),
  email,
});
