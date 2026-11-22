import rateLimit from "express-rate-limit";

const createLimiter = (limit, message, windowMs = 15 * 60 * 1000) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message },
  });

// Chặt hơn cho API gửi OTP để tránh bị lạm dụng gửi email hàng loạt
export const otpRequestLimiter = createLimiter(
  10,
  "Bạn yêu cầu mã quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.",
);

export const authLimiter = createLimiter(
  50,
  "Bạn thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.",
);

// Đăng nhập bằng mật khẩu bị chặn chặt hơn để chống dò mật khẩu
export const staffLoginLimiter = createLimiter(
  10,
  "Bạn đăng nhập sai quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.",
);

// Tối đa 10 đánh giá mỗi giờ để chống gửi hàng loạt
export const reviewLimiter = createLimiter(
  10,
  "Bạn gửi đánh giá quá nhiều. Vui lòng thử lại sau 1 giờ.",
  60 * 60 * 1000,
);

// Chống đặt phòng hàng loạt (khách vãng lai không cần tài khoản)
export const bookingLimiter = createLimiter(
  20,
  "Bạn đặt phòng quá nhiều lần. Vui lòng thử lại sau 1 giờ.",
  60 * 60 * 1000,
);

// Chống dò mã đặt phòng khi tra cứu
export const lookupLimiter = createLimiter(
  30,
  "Bạn tra cứu quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.",
);

// Giới hạn tạo giao dịch công khai, bao gồm luồng khách vãng lai.
export const paymentCreateLimiter = createLimiter(
  10,
  "Bạn tạo yêu cầu thanh toán quá nhiều lần. Vui lòng thử lại sau 15 phút.",
);

// Trang kết quả tự kiểm tra trạng thái mỗi vài giây nên giới hạn cao hơn.
export const paymentStatusLimiter = createLimiter(
  120,
  "Bạn kiểm tra trạng thái thanh toán quá nhiều lần. Vui lòng thử lại sau.",
  60 * 1000,
);
