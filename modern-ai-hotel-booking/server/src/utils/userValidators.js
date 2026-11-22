import { z } from "zod";

const MIN_BIRTH_YEAR = 1900;

// Bỏ khoảng trắng và ký tự phân cách, đổi đầu số +84 / 84 thành 0
export const normalizePhone = (value) => {
  const digits = value.replace(/[\s.\-()]/g, "");

  if (digits.startsWith("+84")) return `0${digits.slice(3)}`;
  if (/^84\d{9,10}$/.test(digits)) return `0${digits.slice(2)}`;

  return digits;
};

// Ngày sinh dạng YYYY-MM-DD, là ngày có thật, không ở tương lai
const isValidBirthDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(value);
  const isRealDate = !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;

  return isRealDate && date.getUTCFullYear() >= MIN_BIRTH_YEAR && date <= new Date();
};

// Chỉ nhận đúng các trường này; mọi trường khác (role, avatar, status...) bị bỏ qua
export const updateProfileSchema = z
  .object({
    fullName: z
      .string({ error: "Vui lòng nhập họ và tên." })
      .trim()
      .min(2, "Họ và tên tối thiểu 2 ký tự.")
      .max(100, "Họ và tên tối đa 100 ký tự."),

    phone: z
      .string({ error: "Số điện thoại không hợp lệ." })
      .trim()
      .transform(normalizePhone)
      .refine((value) => value === "" || /^0\d{9,10}$/.test(value), "Số điện thoại phải gồm 10–11 chữ số."),

    dateOfBirth: z
      .string({ error: "Ngày sinh không hợp lệ." })
      .trim()
      .refine((value) => value === "" || isValidBirthDate(value), "Ngày sinh không hợp lệ."),

    gender: z.enum(["", "MALE", "FEMALE", "OTHER"], { error: "Giới tính không hợp lệ." }),

    nationality: z
      .string({ error: "Quốc tịch không hợp lệ." })
      .trim()
      .max(100, "Quốc tịch tối đa 100 ký tự."),

    address: z
      .string({ error: "Địa chỉ không hợp lệ." })
      .trim()
      .max(255, "Địa chỉ tối đa 255 ký tự."),
  })
  .partial();
