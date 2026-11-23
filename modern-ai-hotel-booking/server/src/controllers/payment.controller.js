import crypto from "node:crypto";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import { createNotification } from "../services/notification.service.js";
import { sendBookingConfirmation } from "../services/mail.service.js";
import { createSePayCheckout } from "../services/sepayService.js";
import {
  createZaloPayOrder,
  verifyZaloPayCallback,
} from "../services/zalopayService.js";

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const hashGuestToken = (token) =>
  crypto.createHash("sha256").update(token, "utf8").digest("hex");

const timingSafeStringEqual = (left, right) => {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * Tìm booking/payment theo tài khoản đăng nhập hoặc token bí mật của khách vãng lai.
 * Không dùng bookingId đơn thuần làm quyền truy cập vì như vậy sẽ tạo lỗi IDOR.
 */
const findAuthorizedBookingPayment = async ({
  bookingId,
  user,
  guestPaymentToken,
}) => {
  if (user?._id) {
    const booking = await Booking.findOne({ _id: bookingId, userId: user._id });
    if (!booking) return null;

    const payment = await Payment.findOne({
      bookingId: booking._id,
      userId: user._id,
    }).sort({ createdAt: -1 });
    return payment ? { booking, payment } : null;
  }

  if (typeof guestPaymentToken !== "string" || guestPaymentToken.length < 40)
    return null;

  const booking = await Booking.findOne({ _id: bookingId, userId: null });
  if (!booking) return null;

  const payment = await Payment.findOne({
    bookingId: booking._id,
    userId: null,
  })
    .select("+guestPaymentTokenHash")
    .sort({ createdAt: -1 });
  if (!payment?.guestPaymentTokenHash) return null;

  const submittedHash = hashGuestToken(guestPaymentToken);
  if (!timingSafeStringEqual(payment.guestPaymentTokenHash, submittedHash))
    return null;

  return { booking, payment };
};

const preparePayment = async (req, res, method) => {
  try {
    const { bookingId } = req.body || {};
    if (!isValidObjectId(bookingId)) {
      return res
        .status(400)
        .json({ success: false, message: "Mã đơn đặt phòng không hợp lệ." });
    }

    const guestPaymentToken =
      req.get("X-Guest-Payment-Token") || req.body?.guestPaymentToken;
    const authorized = await findAuthorizedBookingPayment({
      bookingId,
      user: req.user,
      guestPaymentToken,
    });
    if (!authorized) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy đơn đặt phòng hoặc thông tin xác thực khách vãng lai không hợp lệ.",
      });
    }

    const { booking, payment } = authorized;
    if (booking.status !== "PENDING_PAYMENT") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Đơn đặt phòng không ở trạng thái chờ thanh toán.",
        });
    }
    if (booking.paymentStatus === "PAID" || payment.status === "SUCCEEDED") {
      return res
        .status(409)
        .json({ success: false, message: "Đơn đặt phòng đã được thanh toán." });
    }

    payment.method = method;
    payment.status = "PENDING";
    payment.providerOrderId = undefined;
    payment.providerRequestId = undefined;
    payment.providerTransactionId = "";
    payment.providerResponseCode = "";
    payment.providerMessage = "";
    payment.gatewayResponse = undefined;
    payment.paidAt = undefined;
    payment.expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    // Với khách vãng lai, nhà cung cấp vẫn nhận email/tên người thanh toán từ guestInfo.
    const paymentUser = req.user || {
      _id: null,
      email: booking.guestInfo?.email,
      fullName: booking.guestInfo?.fullName,
    };

    if (method === "SEPAY") {
      const result = createSePayCheckout({
        payment,
        booking,
        user: paymentUser,
      });
      payment.providerOrderId = result.invoiceNumber;
      await payment.save();
      return res.json({
        success: true,
        data: {
          checkoutUrl: result.checkoutUrl,
          checkoutFields: result.checkoutFields,
          bookingId: booking._id,
        },
      });
    }

    if (method === "ZALOPAY") {
      const result = await createZaloPayOrder({
        payment,
        booking,
        user: paymentUser,
      });
      payment.providerOrderId = result.appTransId;
      payment.providerRequestId = result.requestId;
      payment.gatewayResponse = result.response;
      await payment.save();
      return res.json({
        success: true,
        data: { paymentUrl: result.paymentUrl, bookingId: booking._id },
      });
    }

    return res
      .status(400)
      .json({
        success: false,
        message: "Phương thức thanh toán không hợp lệ.",
      });
  } catch (error) {
    console.error(`Create ${method} payment error:`, error);
    const missingConfig = error.message?.startsWith("Thiếu cấu hình");
    return res.status(missingConfig ? 503 : 502).json({
      success: false,
      message:
        error.message || "Không thể khởi tạo thanh toán. Vui lòng thử lại.",
    });
  }
};

export const createSePayPayment = (req, res) =>
  preparePayment(req, res, "SEPAY");
export const createZaloPayPayment = (req, res) =>
  preparePayment(req, res, "ZALOPAY");

/**
 * Chỉ callback/IPN có xác thực từ nhà cung cấp mới được đánh dấu đã thanh toán.
 * URL redirect của trình duyệt không được dùng làm bằng chứng giao dịch thành công.
 */
const settlePayment = async ({
  payment,
  booking,
  transactionId,
  responseCode,
  message,
  raw,
}) => {
  const session = await mongoose.startSession();
  let newlyPaid = false;

  try {
    await session.withTransaction(async () => {
      const currentPayment = await Payment.findById(payment._id).session(
        session,
      );
      const currentBooking = await Booking.findById(booking._id).session(
        session,
      );
      if (
        !currentPayment ||
        !currentBooking ||
        currentPayment.status === "SUCCEEDED" ||
        currentBooking.status === "CANCELLED"
      )
        return;

      currentPayment.status = "SUCCEEDED";
      currentPayment.providerTransactionId = transactionId
        ? String(transactionId)
        : currentPayment.providerTransactionId;
      currentPayment.providerResponseCode = String(responseCode ?? "");
      currentPayment.providerMessage = message || "Thanh toán thành công";
      currentPayment.gatewayResponse = raw || {};
      currentPayment.paidAt = new Date();

      currentBooking.paymentStatus = "PAID";
      // Không khôi phục đơn đã bị hủy khi khách đang ở trang thanh toán.
      if (currentBooking.status !== "CANCELLED")
        currentBooking.status = "CONFIRMED";

      await currentPayment.save({ session });
      await currentBooking.save({ session });
      newlyPaid = true;

      if (currentBooking.userId) {
        await createNotification(
          {
            userId: currentBooking.userId,
            type: "PAYMENT_SUCCESS",
            title: "Thanh toán thành công",
            message: `Đơn đặt phòng ${currentBooking.bookingCode} đã được cổng thanh toán xác nhận.`,
            data: {
              bookingId: currentBooking._id,
              hotelId: currentBooking.hotelId,
            },
          },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }

  // Chỉ gửi sau khi webhook/callback được xác minh và giao dịch đã commit thành công.
  if (newlyPaid) {
    const confirmed = await Booking.findById(booking._id)
      .populate("hotelId", "name")
      .populate("roomTypeId", "name")
      .lean();
    if (confirmed?.guestInfo?.email) {
      sendBookingConfirmation(confirmed.guestInfo.email, {
        bookingCode: confirmed.bookingCode,
        guestName: confirmed.guestInfo.fullName,
        hotelName: confirmed.hotelId?.name || "Khách sạn",
        roomName: confirmed.roomTypeId?.name || "Phòng",
        rooms: confirmed.rooms,
        checkIn: new Date(confirmed.checkIn).toLocaleDateString("vi-VN"),
        checkOut: new Date(confirmed.checkOut).toLocaleDateString("vi-VN"),
        nights: confirmed.nights,
        guests: confirmed.guests.adults + confirmed.guests.children,
        total: confirmed.totalAmount,
        paymentMethod: payment.method,
      }).catch((error) =>
        console.error("Gửi xác nhận thanh toán thất bại:", error),
      );
    }
  }
  return newlyPaid;
};

export const sepayIpn = async (req, res) => {
  try {
    const configuredSecret = process.env.SEPAY_IPN_SECRET?.trim();
    const suppliedSecret =
      req.get("X-Secret-Key") ||
      req.get("x-secret-key") ||
      req.headers["x-secret-key"];

    console.log("[SePay IPN] Nhận callback webhook:", {
      hasSecretHeader: Boolean(suppliedSecret),
      headers: req.headers,
      body: req.body,
    });

    if (configuredSecret) {
      if (
        !suppliedSecret ||
        !timingSafeStringEqual(suppliedSecret, configuredSecret)
      ) {
        console.warn("[SePay IPN] Xác thực X-Secret-Key thất bại.");
        return res
          .status(401)
          .json({
            success: false,
            message:
              "IPN authentication failed. Vui lòng cấu hình Secret Key trên SePay trùng với SEPAY_IPN_SECRET.",
          });
      }
    }

    const body = req.body || {};
    if (body.notification_type === "TRANSACTION_VOID") {
      console.log(
        "[SePay IPN] Nhận thông báo hủy giao dịch (TRANSACTION_VOID).",
      );
      return res
        .status(200)
        .json({ success: true, message: "Void notification received." });
    }
    if (body.notification_type !== "ORDER_PAID") {
      console.log(
        `[SePay IPN] Bỏ qua notification_type: ${body.notification_type}`,
      );
      return res
        .status(200)
        .json({ success: true, message: "Notification ignored." });
    }

    const order = body.order || {};
    const transaction = body.transaction || {};

    // Tìm payment theo mã hóa đơn, nếu không thấy fallback sang bookingId trong custom_data
    let payment = await Payment.findOne({
      method: "SEPAY",
      providerOrderId: order.order_invoice_number,
    });
    if (!payment && order.custom_data) {
      let customData = order.custom_data;
      if (typeof customData === "string") {
        try {
          customData = JSON.parse(customData);
        } catch {}
      }
      if (customData?.bookingId && isValidObjectId(customData.bookingId)) {
        payment = await Payment.findOne({
          method: "SEPAY",
          bookingId: customData.bookingId,
        });
      }
    }

    if (!payment) {
      console.warn(
        `[SePay IPN] Không tìm thấy giao dịch cho invoice: ${order.order_invoice_number}`,
      );
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giao dịch." });
    }

    const orderAmount = Number(order.order_amount);
    const transactionAmount = Number(
      transaction.transaction_amount ?? order.order_amount,
    );
    if (
      !Number.isFinite(orderAmount) ||
      Math.round(orderAmount) !== Math.round(payment.amount) ||
      (Number.isFinite(transactionAmount) &&
        Math.round(transactionAmount) !== Math.round(payment.amount))
    ) {
      console.warn(
        `[SePay IPN] Số tiền không khớp: order=${orderAmount}, tx=${transactionAmount}, expected=${payment.amount}`,
      );
      return res
        .status(400)
        .json({ success: false, message: "Số tiền thanh toán không khớp." });
    }
    if (order.order_currency && order.order_currency !== "VND") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Loại tiền thanh toán không hợp lệ.",
        });
    }
    if (order.order_status !== "CAPTURED") {
      console.warn(
        `[SePay IPN] Trạng thái đơn chưa hoàn tất: ${order.order_status}`,
      );
      return res
        .status(400)
        .json({ success: false, message: "Giao dịch chưa được phê duyệt." });
    }

    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      console.warn(
        `[SePay IPN] Không tìm thấy đơn đặt phòng: ${payment.bookingId}`,
      );
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt phòng." });
    }

    await settlePayment({
      payment,
      booking,
      transactionId: transaction.transaction_id || order.id || order.order_id,
      responseCode: transaction.transaction_status || order.order_status,
      message: "SePay ORDER_PAID",
      raw: body,
    });

    console.log(
      `[SePay IPN] Thanh toán thành công cho đơn đặt phòng ${booking.bookingCode} (${booking._id})`,
    );
    return res
      .status(200)
      .json({ success: true, message: "Xác nhận thanh toán thành công." });
  } catch (error) {
    console.error("SePay IPN error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const zaloPayCallback = async (req, res) => {
  try {
    const body = req.body || {};
    if (!verifyZaloPayCallback(body)) {
      return res
        .status(400)
        .json({
          return_code: -1,
          return_message: "Invalid callback signature",
        });
    }

    const data = JSON.parse(body.data);
    if (String(data.app_id) !== String(process.env.ZALOPAY_APP_ID)) {
      return res
        .status(400)
        .json({ return_code: -1, return_message: "Invalid app id" });
    }

    const payment = await Payment.findOne({
      method: "ZALOPAY",
      providerOrderId: data.app_trans_id,
    });
    if (!payment)
      return res
        .status(404)
        .json({ return_code: 0, return_message: "Payment not found" });
    if (
      !Number.isFinite(Number(data.amount)) ||
      Math.round(Number(data.amount)) !== Math.round(payment.amount)
    ) {
      return res
        .status(400)
        .json({ return_code: -1, return_message: "Invalid amount" });
    }

    const booking = await Booking.findById(payment.bookingId);
    if (!booking)
      return res
        .status(404)
        .json({ return_code: 0, return_message: "Booking not found" });

    await settlePayment({
      payment,
      booking,
      transactionId: data.zp_trans_id,
      responseCode: 1,
      message: "ZaloPay callback success",
      raw: data,
    });

    return res.status(200).json({ return_code: 1, return_message: "success" });
  } catch (error) {
    console.error("ZaloPay callback error:", error);
    return res
      .status(500)
      .json({ return_code: 0, return_message: "Internal error" });
  }
};

export const getPaymentStatus = async (req, res) => {
  if (!isValidObjectId(req.params.bookingId)) {
    return res
      .status(400)
      .json({ success: false, message: "Mã đơn đặt phòng không hợp lệ." });
  }

  const guestPaymentToken = req.get("X-Guest-Payment-Token");
  const authorized = await findAuthorizedBookingPayment({
    bookingId: req.params.bookingId,
    user: req.user,
    guestPaymentToken,
  });
  if (!authorized) {
    return res.status(404).json({
      success: false,
      message:
        "Không tìm thấy đơn hoặc thông tin xác thực thanh toán không hợp lệ.",
    });
  }

  const { booking, payment } = authorized;
  return res.json({
    success: true,
    data: {
      payment: {
        bookingId: payment.bookingId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        providerTransactionId: payment.providerTransactionId,
        providerResponseCode: payment.providerResponseCode,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      },
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        bookingCode: booking.bookingCode,
        lookupEmail: booking.guestInfo?.email,
      },
    },
  });
};
