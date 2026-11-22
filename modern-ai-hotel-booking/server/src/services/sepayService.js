import { SePayPgClient } from "sepay-pg-node";

const requiredEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu cấu hình ${name} trong server/.env.`);
  return value;
};

const getFrontendUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

/** Tạo form checkout SePay Sandbox. Frontend sẽ POST các field đã ký sang SePay. */
export const createSePayCheckout = ({ payment, booking, user }) => {
  const client = new SePayPgClient({
    env: "sandbox",
    merchant_id: requiredEnv("SEPAY_MERCHANT_ID"),
    secret_key: requiredEnv("SEPAY_SECRET_KEY"),
  });

  // Invoice phải duy nhất cho mỗi lần thử thanh toán.
  const invoiceNumber = `HTL${Date.now()}${String(payment._id).slice(-8)}`.slice(0, 40);
  const resultUrl = `${getFrontendUrl()}/payment/result?provider=sepay&bookingId=${booking._id}`;

  const checkoutFields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: invoiceNumber,
    order_amount: Math.round(payment.amount),
    currency: "VND",
    order_description: `Thanh toan dat phong ${booking.bookingCode}`.slice(0, 255),
    customer_id: String(user?._id || booking.userId || booking.guestInfo?.email || "guest"),
    success_url: resultUrl,
    error_url: `${resultUrl}&result=failed`,
    cancel_url: `${resultUrl}&result=cancelled`,
    custom_data: JSON.stringify({ bookingId: String(booking._id), bookingCode: booking.bookingCode }),
  });

  return {
    invoiceNumber,
    checkoutUrl: process.env.SEPAY_CHECKOUT_URL || "https://pay-sandbox.sepay.vn/v1/checkout/init",
    checkoutFields,
  };
};
