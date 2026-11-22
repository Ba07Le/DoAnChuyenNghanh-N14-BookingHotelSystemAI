import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Inventory from "../models/Inventory.js";

import * as bookingService from "../services/booking.service.js";
import { createNotification } from "../services/notification.service.js";
import { completePastBookings } from "../services/bookingLifecycle.service.js";

// Chuyển lỗi async về Express error handler
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// XEM BÁO GIÁ VÀ TỒN PHÒNG
export const quoteBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.getQuote(res.locals.query);

  return res.json({
    success: true,
    data,
  });
});

// TẠO BOOKING - KHÁCH ĐĂNG NHẬP HOẶC VÃNG LAI
export const createBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.user ?? null, req.body);

  return res.status(201).json({
    success: true,
    message: "Đặt phòng thành công.",
    data,
  });
});

// TRA CỨU BOOKING CỦA KHÁCH VÃNG LAI
export const lookupBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.lookupBooking(res.locals.query);

  return res.json({
    success: true,
    data,
  });
});

// DANH SÁCH BOOKING CỦA NGƯỜI DÙNG
export const myBookings = asyncHandler(async (req, res) => {
  await completePastBookings(req.user._id);

  const data = await Booking.find({
    userId: req.user._id,
  })
    .populate("hotelId", "name slug images address")
    .populate("roomTypeId", "name basePrice")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    success: true,
    data,
  });
});

// CHI TIẾT BOOKING
export const getBooking = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Mã booking không hợp lệ.",
    });
  }

  const filter =
    req.user.role === "ADMIN"
      ? { _id: req.params.id }
      : {
          _id: req.params.id,
          userId: req.user._id,
        };

  const data = await Booking.findOne(filter)
    .populate("hotelId", "name slug images address policies contact")
    .populate("roomTypeId", "name basePrice capacity bedType images")
    .lean();

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn đặt phòng.",
    });
  }

  return res.json({
    success: true,
    data,
  });
});

// THANH TOÁN DEMO - CHỈ ADMIN TRONG MÔI TRƯỜNG DEV
export const markPaid = asyncHandler(async (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_MOCK_PAYMENT !== "true"
  ) {
    return res.status(403).json({
      success: false,
      message: "Chức năng thanh toán demo đã bị tắt.",
    });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Mã booking không hợp lệ.",
    });
  }

  const session = await mongoose.startSession();
  let updatedBooking;

  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.params.id).session(session);

      if (!booking) {
        const error = new Error("Không tìm thấy booking.");
        error.status = 404;
        throw error;
      }

      if (
        ["CANCELLED", "COMPLETED"].includes(booking.status) ||
        booking.paymentStatus !== "UNPAID"
      ) {
        const error = new Error("Booking không thể thanh toán demo.");
        error.status = 409;
        throw error;
      }

      const payment = await Payment.findOne({
        bookingId: booking._id,
        method: "MOCK",
        status: "PENDING",
      }).session(session);

      if (!payment) {
        const error = new Error("Không tìm thấy giao dịch MOCK đang chờ.");
        error.status = 409;
        throw error;
      }

      payment.status = "SUCCEEDED";
      payment.paidAt = new Date();
      await payment.save({ session });

      booking.paymentStatus = "PAID";
      booking.status = "CONFIRMED";
      await booking.save({ session });

      updatedBooking = booking;
    });
  } finally {
    await session.endSession();
  }

  return res.json({
    success: true,
    message: "Thanh toán demo thành công.",
    data: updatedBooking,
  });
});

// HỦY BOOKING - CẬP NHẬT TRẠNG THÁI VÀ TỒN KHO
export const cancelBooking = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Mã booking không hợp lệ.",
    });
  }

  const filter =
    req.user.role === "ADMIN"
      ? { _id: req.params.id }
      : {
          _id: req.params.id,
          userId: req.user._id,
        };

  const session = await mongoose.startSession();
  let cancelledBooking;

  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findOne(filter).session(session);

      if (!booking) {
        const error = new Error("Không tìm thấy booking.");
        error.status = 404;
        throw error;
      }

      if (["COMPLETED", "CANCELLED", "CHECKED_IN"].includes(booking.status)) {
        const error = new Error("Booking không thể hủy ở trạng thái hiện tại.");
        error.status = 400;
        throw error;
      }

      // Không tự đánh dấu REFUNDED khi chưa hoàn tiền thật
      if (booking.paymentStatus !== "UNPAID") {
        const error = new Error(
          "Booking đã thanh toán. Vui lòng xử lý hoàn tiền trước khi hủy.",
        );
        error.status = 409;
        throw error;
      }

      const updated = await Booking.updateOne(
        {
          _id: booking._id,
          status: booking.status,
          paymentStatus: "UNPAID",
        },
        {
          $set: {
            status: "CANCELLED",
          },
        },
        { session },
      );

      if (updated.matchedCount !== 1) {
        const error = new Error(
          "Booking đã thay đổi trạng thái. Vui lòng thử lại.",
        );
        error.status = 409;
        throw error;
      }

      // Hoàn tồn kho cho từng đêm đã giữ phòng
      const dates = [];

      for (
        let d = new Date(booking.checkIn);
        d < booking.checkOut;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        dates.push(new Date(d));
      }

      const inventoryResult = await Inventory.updateMany(
        {
          roomTypeId: booking.roomTypeId,
          date: { $in: dates },
        },
        {
          $inc: {
            availableRooms: booking.rooms,
          },
        },
        { session },
      );

      if (inventoryResult.matchedCount !== dates.length) {
        const error = new Error("Không thể hoàn tồn kho đầy đủ cho booking.");
        error.status = 409;
        throw error;
      }

      cancelledBooking = {
        ...booking.toObject(),
        status: "CANCELLED",
      };
    });
  } finally {
    await session.endSession();
  }

  // Chỉ tạo thông báo sau khi transaction thành công
  // Khách vãng lai không có userId nên không tạo notification
  if (cancelledBooking.userId) {
    try {
      await createNotification({
        userId: cancelledBooking.userId,
        type: "BOOKING_CANCELLED",
        title: "Đã hủy đặt phòng",
        message: `Booking ${cancelledBooking.bookingCode} đã được hủy.`,
        data: {
          bookingId: cancelledBooking._id,
          hotelId: cancelledBooking.hotelId,
        },
      });
    } catch (error) {
      console.error("Không thể tạo thông báo hủy:", error);
    }
  }

  return res.json({
    success: true,
    message: "Đã hủy booking.",
    data: cancelledBooking,
  });
});

// DANH SÁCH BOOKING DÀNH CHO ADMIN
export const allBookings = asyncHandler(async (req, res) => {
  await completePastBookings();

  const data = await Booking.find({})
    .populate("userId", "fullName email")
    .populate("hotelId", "name")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return res.json({
    success: true,
    data,
  });
});
