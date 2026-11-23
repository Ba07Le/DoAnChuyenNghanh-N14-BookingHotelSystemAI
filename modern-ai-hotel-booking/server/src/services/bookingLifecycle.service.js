import Booking from "../models/Booking.js";
import { createNotification } from "./notification.service.js";

const COMPLETABLE_STATUSES = ["CONFIRMED", "CHECKED_IN"];

/**
 * Booking.checkOut được lưu ở đầu ngày theo múi giờ máy chủ (cùng quy ước với dateOnly).
 * Chỉ hoàn tất khi ngày trả phòng đã qua; không hoàn tất ngay trong ngày check-out.
 */
const startOfToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

/**
 * Tự chuyển các đơn đã xác nhận/đang lưu trú sang COMPLETED khi ngày trả phòng đã qua.
 * Hàm có thể chạy khi khách mở danh sách đặt phòng hoặc khi gửi đánh giá.
 * Cập nhật từng đơn có điều kiện để chỉ gửi thông báo nhắc đánh giá một lần.
 */
export const completePastBookings = async (userId = null, bookingId = null) => {
  const today = startOfToday();
  const filter = {
    status: { $in: COMPLETABLE_STATUSES },
    checkOut: { $lt: today },
    ...(userId ? { userId } : {}),
    ...(bookingId ? { _id: bookingId } : {}),
  };

  const candidates = await Booking.find(filter)
    .select("_id userId hotelId bookingCode")
    .lean();

  let completedCount = 0;

  for (const candidate of candidates) {
    // Điều kiện status + checkOut được kiểm tra lại trong update để tránh xử lý trùng khi request đồng thời.
    const completed = await Booking.findOneAndUpdate(
      {
        _id: candidate._id,
        status: { $in: COMPLETABLE_STATUSES },
        checkOut: { $lt: today },
      },
      { $set: { status: "COMPLETED" } },
      { new: true },
    )
      .select("_id userId hotelId bookingCode")
      .lean();

    if (!completed) continue;
    completedCount += 1;

    if (completed.userId) {
      createNotification({
        userId: completed.userId,
        type: "REVIEW_REMINDER",
        title: "Hãy đánh giá kỳ lưu trú",
        message: `Kỳ lưu trú của đơn ${completed.bookingCode} đã hoàn tất. Hãy chia sẻ trải nghiệm của bạn.`,
        data: { bookingId: completed._id, hotelId: completed.hotelId },
      }).catch((error) => console.error("Không thể tạo thông báo nhắc đánh giá:", error.message));
    }
  }

  return completedCount;
};
