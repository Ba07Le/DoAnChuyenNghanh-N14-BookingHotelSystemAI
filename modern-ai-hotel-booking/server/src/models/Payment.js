import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // Booking liên quan đến giao dịch
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    // Người thực hiện thanh toán
    // null: khách vãng lai
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Hash token dùng cho khách vãng lai
    // Không lưu token gốc
    guestPaymentTokenHash: {
      type: String,
      select: false,
    },

    // Số tiền thanh toán
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Phương thức thanh toán
    method: {
      type: String,
      enum: ["CASH", "SEPAY", "ZALOPAY", "STRIPE", "MOCK"],
      default: "MOCK",
    },

    // Trạng thái giao dịch
    status: {
      type: String,
      enum: ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    // Mã đơn hàng phía cổng thanh toán
    providerOrderId: {
      type: String,
      trim: true,
    },

    // Mã yêu cầu thanh toán
    providerRequestId: {
      type: String,
      trim: true,
    },

    // Mã giao dịch của nhà cung cấp
    providerTransactionId: {
      type: String,
      trim: true,
      default: "",
    },

    // Mã phản hồi từ cổng thanh toán
    providerResponseCode: {
      type: String,
      trim: true,
      default: "",
    },

    // Thông báo từ cổng thanh toán
    providerMessage: {
      type: String,
      trim: true,
      default: "",
    },

    // Dữ liệu phản hồi từ cổng thanh toán
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    // Thời điểm hết hạn thanh toán
    expiresAt: {
      type: Date,
    },

    // Thời điểm thanh toán thành công
    paidAt: {
      type: Date,
    },

    // Giữ lại dữ liệu Stripe cũ
    stripePaymentIntentId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "payments",
  },
);

// Giữ index Stripe hiện tại để tránh thay đổi
// cấu trúc index MongoDB khi đang hợp nhất
paymentSchema.index(
  { stripePaymentIntentId: 1 },
  {
    unique: true,
    sparse: true,
  },
);

// Chống trùng mã đơn hàng theo từng cổng thanh toán
paymentSchema.index(
  {
    method: 1,
    providerOrderId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      providerOrderId: {
        $type: "string",
        $gt: "",
      },
    },
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
