import mongoose from "mongoose";
import Booking from "../../models/Booking.js";
import Payment from "../../models/Payment.js";
import Inventory from "../../models/Inventory.js";
import Notification from "../../models/Notification.js";
import { httpError } from "../../utils/httpError.js";
import { vnStart, vnEnd } from "../../utils/dateRange.js";
import { logAudit } from "../audit.service.js";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listBookings = async ({ page, limit, search, status, paymentStatus, hotelId, from, to }) => {
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (hotelId) filter.hotelId = hotelId;
  if (from || to) filter.createdAt = { ...(from && { $gte: vnStart(from) }), ...(to && { $lte: vnEnd(to) }) };
  if (search) {
    const rx = new RegExp(esc(search), "i");
    filter.$or = [{ bookingCode: rx }, { "guestInfo.fullName": rx }, { "guestInfo.email": rx }];
  }
  const [items, total] = await Promise.all([
    Booking.find(filter).populate("userId", "fullName email").populate("hotelId", "name").populate("roomTypeId", "name")
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);
  return { items, total };
};

export const getBooking = async (id) => {
  const booking = await Booking.findById(id)
    .populate("userId", "fullName email phone").populate("hotelId", "name address").populate("roomTypeId", "name basePrice").lean();
  if (!booking) throw httpError(404, "Không tìm thấy đặt phòng.");
  const payment = await Payment.findOne({ bookingId: id }).lean();
  return { ...booking, payment };
};

// Admin chỉ được XEM và HUỶ. Không có hàm "xác nhận": CONFIRMED chỉ do luồng thanh toán/webhook quyết định.
export const cancelBooking = async (ctx, id, { reason }) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const booking = await Booking.findById(id).session(session);
      if (!booking) throw httpError(404, "Không tìm thấy đặt phòng.");
      if (["CHECKED_IN", "COMPLETED", "CANCELLED"].includes(booking.status))
        throw httpError(409, "Đặt phòng ở trạng thái này không thể huỷ.");

      // Trả lại phòng cho từng ngày [checkIn, checkOut)
      const dates = [];
      for (let d = new Date(booking.checkIn); d < booking.checkOut; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
      await Inventory.updateMany({ roomTypeId: booking.roomTypeId, date: { $in: dates } }, { $inc: { availableRooms: booking.rooms } }, { session });

      const wasPaid = booking.paymentStatus === "PAID";
      booking.status = "CANCELLED";
      if (wasPaid) booking.paymentStatus = "REFUNDED";
      await booking.save({ session });
      // Hiện tại thanh toán là MOCK nên chỉ đổi trạng thái. Khi có Stripe thật, gọi hàm hoàn tiền của module Payment ở đây.
      if (wasPaid) await Payment.updateOne({ bookingId: id, status: "SUCCEEDED" }, { status: "REFUNDED" }, { session });
      await Notification.create([{ userId: booking.userId, type: "BOOKING", title: "Đặt phòng đã bị huỷ", message: `Đơn ${booking.bookingCode} đã được huỷ bởi quản trị viên. Lý do: ${reason}`, data: { bookingId: booking._id } }], { session });
      result = booking.toObject();
    });
    await logAudit(ctx, { action: "BOOKING_CANCELLED_BY_ADMIN", entity: "Booking", entityId: id, metadata: { bookingCode: result.bookingCode, reason, refunded: result.paymentStatus === "REFUNDED" } });
    return result;
  } finally {
    await session.endSession();
  }
};
