import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { createNotification } from "../services/notification.service.js";

// Chuyển đơn đặt phòng sang COMPLETED (và gửi thông báo nhắc đánh giá) để thử tính năng đánh giá.
// Chỉ dùng khi phát triển, vì chưa có chức năng chuyển đơn sang COMPLETED.
// Cách dùng:
//   node src/seed/complete-booking-demo.js email@cua-ban.com   mọi đơn chưa huỷ, chưa hoàn thành của tài khoản đó
//   node src/seed/complete-booking-demo.js MA_DON              đúng một đơn theo mã đơn

const COMPLETABLE_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN"];

const target = process.argv[2]?.trim();

const fail = async (message) => {
  console.error(message);
  await mongoose.disconnect();
  process.exit(1);
};

if (!target) {
  console.error("Cách dùng: node src/seed/complete-booking-demo.js email@cua-ban.com");
  process.exit(1);
}

await connectDatabase();

let filter;

if (target.includes("@")) {
  const user = await User.findOne({ email: target.toLowerCase() });
  if (!user) await fail(`Không tìm thấy tài khoản ${target}.`);

  filter = { userId: user._id };
} else {
  filter = { bookingCode: target };
}

const bookings = await Booking.find({ ...filter, status: { $in: COMPLETABLE_STATUSES } });

if (!bookings.length) {
  const existing = await Booking.find(filter).select("bookingCode status");
  const detail = existing.length
    ? existing.map((booking) => `${booking.bookingCode}: ${booking.status}`).join(", ")
    : "chưa có đơn nào";

  await fail(`Không có đơn nào để chuyển sang COMPLETED (chỉ chuyển được đơn chưa huỷ và chưa hoàn thành). Hiện có: ${detail}.`);
}

for (const booking of bookings) {
  await Booking.updateOne({ _id: booking._id }, { status: "COMPLETED" });

  await createNotification({
    userId: booking.userId,
    type: "REVIEW_REMINDER",
    title: "Hãy đánh giá chuyến đi",
    message: `Chia sẻ trải nghiệm của bạn về đơn ${booking.bookingCode} để giúp du khách khác.`,
    data: { bookingId: booking._id, hotelId: booking.hotelId },
  });

  console.log(`- ${booking.bookingCode}: COMPLETED`);
}

console.log(`Đã chuyển ${bookings.length} đơn sang COMPLETED. Tải lại trang "Đặt phòng của tôi" để viết đánh giá.`);

await mongoose.disconnect();