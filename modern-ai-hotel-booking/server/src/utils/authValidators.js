import { z } from "zod";

const email = z
  .string({ error: "Vui lòng nhập email." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Email không hợp lệ."));

export const otpRequestSchema = z.object({ email });

export const otpVerifySchema = z.object({
  email,
  code: z
    .string({ error: "Vui lòng nhập mã xác nhận." })
    .trim()
    .regex(/^\d{6}$/, "Mã xác nhận gồm 6 chữ số."),
});

export const googleSchema = z.object({
  credential: z
    .string({ error: "Thiếu thông tin đăng nhập Google." })
    .min(1, "Thiếu thông tin đăng nhập Google."),
});

export const facebookSchema = z.object({
  accessToken: z
    .string({ error: "Thiếu thông tin đăng nhập Facebook." })
    .min(1, "Thiếu thông tin đăng nhập Facebook."),
});

// Quy tắc mật khẩu khi đặt cho tài khoản quản trị (bcrypt chỉ dùng 72 byte đầu của mật khẩu)
export const staffPasswordSchema = z
  .string({ error: "Vui lòng nhập mật khẩu." })
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
  .max(72, "Mật khẩu tối đa 72 ký tự.")
  .regex(/[A-Za-z]/, "Mật khẩu phải có ít nhất 1 chữ cái.")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số.");

// Khi đăng nhập chỉ kiểm tra có nhập, không tiết lộ quy tắc mật khẩu
export const staffLoginSchema = z.object({
  email,
  password: z
    .string({ error: "Vui lòng nhập mật khẩu." })
    .min(1, "Vui lòng nhập mật khẩu.")
    .max(72, "Email hoặc mật khẩu không chính xác."),
});
