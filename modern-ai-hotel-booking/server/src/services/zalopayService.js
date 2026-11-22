import crypto from "node:crypto";

const requiredEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu cấu hình ${name} trong server/.env.`);
  return value;
};

const hmacSha256 = (data, key) =>
  crypto.createHmac("sha256", key).update(data, "utf8").digest("hex");

const vietnamDatePrefix = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
};

/** Tạo đơn ZaloPay Sandbox theo API v2. */
export const createZaloPayOrder = async ({ payment, booking, user }) => {
  const appId = requiredEnv("ZALOPAY_APP_ID");
  const key1 = requiredEnv("ZALOPAY_KEY1");
  const callbackUrl = requiredEnv("ZALOPAY_CALLBACK_URL");
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

  const appUser = String(
    user?._id || booking.userId || user?.email || booking.guestInfo?.email || "hotelbooking-guest",
  ).slice(0, 50);
  // ZaloPay yêu cầu app_trans_id bắt đầu bằng yymmdd theo múi giờ Việt Nam.
  const appTransId = `${vietnamDatePrefix()}_${String(payment._id).slice(-8)}_${Date.now().toString().slice(-8)}`.slice(0, 40);
  const appTime = Date.now();
  const amount = Math.round(payment.amount);
  const item = "[]";
  const embedData = JSON.stringify({
    redirecturl: `${clientUrl}/payment/result?provider=zalopay&bookingId=${booking._id}`,
    bookingId: String(booking._id),
    bookingCode: booking.bookingCode,
  });
  const description = `HotelBookingAI - thanh toan don ${booking.bookingCode}`.slice(0, 256);

  // Chuỗi ký đúng thứ tự theo tài liệu ZaloPay v2.
  const macInput = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;
  const mac = hmacSha256(macInput, key1);

  const form = new URLSearchParams({
    app_id: appId,
    app_user: appUser,
    app_trans_id: appTransId,
    app_time: String(appTime),
    amount: String(amount),
    item,
    description,
    embed_data: embedData,
    bank_code: "",
    callback_url: callbackUrl,
    mac,
  });

  const endpoint = process.env.ZALOPAY_CREATE_URL || "https://sb-openapi.zalopay.vn/v2/create";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || Number(result.return_code) !== 1 || !result.order_url) {
    throw new Error(result.return_message || result.sub_return_message || "ZaloPay không tạo được đơn thanh toán.");
  }

  return {
    appTransId,
    paymentUrl: result.order_url,
    requestId: result.zp_trans_token || result.order_token || "",
    response: result,
  };
};

/** Xác thực callback bằng Key2 của ZaloPay. */
export const verifyZaloPayCallback = (body) => {
  const key2 = process.env.ZALOPAY_KEY2?.trim();
  if (!key2 || typeof body?.data !== "string" || typeof body?.mac !== "string") return false;

  const expected = hmacSha256(body.data, key2);
  const received = body.mac.toLowerCase();
  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
};
