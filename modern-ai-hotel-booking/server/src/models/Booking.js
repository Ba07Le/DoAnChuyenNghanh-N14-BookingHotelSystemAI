import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // Mã đặt phòng
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Người đặt phòng
    // null: khách vãng lai không có tài khoản
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Khách sạn
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    // Loại phòng
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
    },

    // Ngày nhận và trả phòng
    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    // Số lượng khách
    guests: {
      adults: {
        type: Number,
        min: 1,
        default: 1,
      },

      children: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    // Số lượng phòng đặt
    rooms: {
      type: Number,
      min: 1,
      default: 1,
    },

    // Thông tin người lưu trú
    guestInfo: {
      fullName: String,
      email: String,
      phone: String,
      note: String,
    },

    // Giá phòng tại thời điểm đặt
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },

    nights: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    couponCode: {
      type: String,
      default: "",
    },

    // Trạng thái đặt phòng
    status: {
      type: String,
      enum: [
        "PENDING",
        "PENDING_PAYMENT",
        "CONFIRMED",
        "CHECKED_IN",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    // Trạng thái thanh toán
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "REFUNDED"],
      default: "UNPAID",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "bookings",
  },
);

// Danh sách đặt phòng của người dùng
bookingSchema.index({
  userId: 1,
  createdAt: -1,
});

// Truy vấn booking theo khách sạn và thời gian
bookingSchema.index({
  hotelId: 1,
  checkIn: 1,
  checkOut: 1,
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
