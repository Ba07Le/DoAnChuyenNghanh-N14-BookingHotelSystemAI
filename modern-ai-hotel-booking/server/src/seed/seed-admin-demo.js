/**
 * Thêm dữ liệu demo cho dashboard admin MÀ KHÔNG xoá dữ liệu hiện có.
 * Chạy sau `npm run db:reset`:  npm run seed:admin
 * Chạy lại nhiều lần được: dữ liệu demo cũ (email @demo.local, slug demo-*, mã DEMO-*) sẽ được thay mới.
 * Lưu ý: không đụng tới Inventory vì booking demo nằm rải trong 6 tháng qua.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import RoomType from "../models/RoomType.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const ago = (days) => new Date(Date.now() - days * 86400000);
const weighted = (pairs) => { let r = Math.random() * pairs.reduce((s, p) => s + p[1], 0); for (const [v, w] of pairs) { if ((r -= w) < 0) return v; } return pairs[0][0]; };

await mongoose.connect(process.env.MONGODB_URI);

// 1. Dọn dữ liệu demo cũ
const oldUsers = await User.find({ email: /@demo\.local$/ }).select("_id");
await Booking.deleteMany({ bookingCode: /^DEMO-/ });
await Payment.deleteMany({ userId: { $in: oldUsers.map((u) => u._id) } });
await User.deleteMany({ email: /@demo\.local$/ });
await Hotel.deleteMany({ slug: /^demo-/ });

// 2. Khách hàng (rải 180 ngày) + vài tài khoản bị khoá
const hash = await bcrypt.hash("123456", 10);
const customers = await User.insertMany(
  Array.from({ length: 45 }, (_, i) => ({
    fullName: `Khách Demo ${i + 1}`, email: `customer${i + 1}@demo.local`, passwordHash: hash,
    phone: `09${rnd(10000000, 99999999)}`, role: "CUSTOMER", emailVerified: true,
    status: i < 2 ? "BLOCKED" : i < 4 ? "INACTIVE" : "ACTIVE", createdAt: ago(rnd(0, 180)),
  })),
);

// 3. Khách sạn ở nhiều trạng thái duyệt (nhân bản từ khách sạn có sẵn)
const base = await Hotel.find({ status: "APPROVED", slug: { $not: /^demo-/ } }).lean();
if (!base.length) throw new Error("Chưa có khách sạn nào. Chạy `npm run db:reset` trước.");
const extra = [["PENDING_APPROVAL", 3], ["REJECTED", 1], ["SUSPENDED", 1]];
let n = 0;
for (const [status, count] of extra) {
  for (let i = 0; i < count; i++) {
    const { _id, createdAt, updatedAt, __v, ...rest } = pick(base);
    n++;
    await Hotel.create({
      ...rest, name: `Demo ${status === "PENDING_APPROVAL" ? "Chờ duyệt" : status === "REJECTED" ? "Bị từ chối" : "Tạm ngưng"} ${n}`,
      slug: `demo-${status.toLowerCase().replace("_", "-")}-${n}`, status, isFeatured: false, averageRating: 0, reviewCount: 0,
      rejectReason: status === "REJECTED" ? "Hình ảnh chưa rõ ràng, vui lòng bổ sung." : "", createdAt: ago(rnd(1, 20)),
    });
  }
}

// 4. ~320 booking trong 180 ngày
const roomTypes = await RoomType.find({ hotelId: { $in: base.map((h) => h._id) } }).lean();
const bookings = [], payments = [];
for (let i = 0; i < 320; i++) {
  const rt = pick(roomTypes), user = pick(customers), created = ago(rnd(0, 180));
  const nights = rnd(1, 4), rooms = rnd(1, 2);
  const checkIn = new Date(created.getTime() + rnd(1, 20) * 86400000); checkIn.setHours(0, 0, 0, 0);
  const checkOut = new Date(checkIn.getTime() + nights * 86400000);
  const subtotal = rt.basePrice * nights * rooms;
  const discount = Math.random() < 0.2 ? Math.round(subtotal * 0.1) : 0;
  const status = weighted([["COMPLETED", 45], ["CONFIRMED", 20], ["CHECKED_IN", 5], ["CANCELLED", 20], ["PENDING", 10]]);
  const paymentStatus = status === "CANCELLED" ? weighted([["REFUNDED", 6], ["UNPAID", 4]]) : status === "PENDING" ? "UNPAID" : "PAID";
  const doc = {
    bookingCode: `DEMO-${String(i + 1).padStart(4, "0")}-${rnd(1000, 9999)}`, userId: user._id, hotelId: rt.hotelId, roomTypeId: rt._id,
    checkIn, checkOut, guests: { adults: 2, children: 0 }, rooms,
    guestInfo: { fullName: user.fullName, email: user.email, phone: user.phone, note: "Dữ liệu demo cho dashboard admin" },
    pricePerNight: rt.basePrice, nights, subtotal, discount, totalAmount: subtotal - discount, status, paymentStatus,
    createdAt: created, updatedAt: created,
  };
  bookings.push(doc);
}
const inserted = await Booking.insertMany(bookings);
for (const b of inserted) {
  if (b.paymentStatus === "UNPAID" && b.status !== "PENDING") continue;
  payments.push({
    bookingId: b._id, userId: b.userId, amount: b.totalAmount, method: "MOCK",
    stripePaymentIntentId: `pi_demo_${b.bookingCode}`,
    status: b.paymentStatus === "PAID" ? "SUCCEEDED" : b.paymentStatus === "REFUNDED" ? "REFUNDED" : "PENDING",
    paidAt: b.paymentStatus === "UNPAID" ? undefined : b.createdAt, createdAt: b.createdAt, updatedAt: b.createdAt,
  });
}
await Payment.insertMany(payments);

console.log(`Đã thêm: ${customers.length} khách, ${n} khách sạn demo (chờ duyệt/từ chối/tạm ngưng), ${inserted.length} booking, ${payments.length} payment.`);
await mongoose.disconnect();
