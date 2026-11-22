import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import User from "../models/User.js";
import { createNotification } from "../services/notification.service.js";

// Tạo thông báo mẫu (mỗi loại một cái) cho một tài khoản để thử trang Thông báo.
// Cách dùng: node src/seed/notification-demo.js email@cua-ban.com

const DEMO_NOTIFICATIONS = [
  { type: "BOOKING_CONFIRMED", title: "Đặt phòng thành công", message: "Mã đặt phòng DEMO001 đã được tạo." },
  { type: "BOOKING_CANCELLED", title: "Đã huỷ đặt phòng", message: "Booking DEMO002 đã được huỷ." },
  { type: "PAYMENT_SUCCESS", title: "Thanh toán thành công", message: "Booking DEMO001 đã được thanh toán." },
  { type: "PAYMENT_FAILED", title: "Thanh toán thất bại", message: "Không thể thanh toán booking DEMO003. Vui lòng thử lại." },
  { type: "CHECK_IN_REMINDER", title: "Sắp đến ngày nhận phòng", message: "Bạn nhận phòng vào ngày mai, hãy chuẩn bị giấy tờ tuỳ thân." },
  { type: "REVIEW_REMINDER", title: "Hãy đánh giá chuyến đi", message: "Chia sẻ trải nghiệm của bạn để giúp du khách khác." },
  { type: "PROMOTION", title: "Ưu đãi cuối tuần", message: "Giảm 15% cho đặt phòng trong tháng này." },
  { type: "SYSTEM", title: "Chào mừng bạn đến HOTELAI", message: "Tài khoản của bạn đã sẵn sàng." },
];

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Cách dùng: node src/seed/notification-demo.js email@cua-ban.com");
  process.exit(1);
}

await connectDatabase();

const user = await User.findOne({ email });

if (!user) {
  console.error(`Không tìm thấy tài khoản ${email}. Hãy đăng nhập bằng email này trên web trước.`);
  await mongoose.disconnect();
  process.exit(1);
}

for (const notification of DEMO_NOTIFICATIONS) {
  await createNotification({ userId: user._id, ...notification });
}

console.log(`Đã tạo ${DEMO_NOTIFICATIONS.length} thông báo mẫu cho ${email}`);

await mongoose.disconnect();