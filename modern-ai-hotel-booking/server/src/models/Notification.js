import mongoose from "mongoose";

// Các loại thông báo của hệ thống
const NOTIFICATION_TYPES = [
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "CHECK_IN_REMINDER",
  "REVIEW_REMINDER",
  "PROMOTION",
  "SYSTEM",
];

// Chuyển loại thông báo cũ sang loại mới
const upgradeLegacyType = (value) => {
  if (value === "BOOKING") {
    return "BOOKING_CONFIRMED";
  }

  return value;
};

const notificationSchema = new mongoose.Schema(
  {
    // Người nhận thông báo
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Loại thông báo
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: "SYSTEM",
      set: upgradeLegacyType,
    },

    // Tiêu đề
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // Nội dung thông báo
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Dữ liệu liên quan đến thông báo
    // Ví dụ: bookingId, hotelId, paymentId, đường dẫn...
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    // Trạng thái đã đọc
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  },
);

// Lấy danh sách thông báo mới nhất của người dùng
notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

// Lọc thông báo chưa đọc và đếm số lượng
notificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1,
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
