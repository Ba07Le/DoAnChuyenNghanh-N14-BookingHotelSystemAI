import nodemailer from "nodemailer";
import { httpError } from "../utils/httpError.js";

let transporter;

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 587;

  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  return transporter;
};

const buildOtpEmail = (code, ttlSeconds) => ({
  subject: `${code} là mã đăng nhập HOTELAI của bạn`,
  text:
    `Mã xác nhận của bạn là: ${code}\n\n` +
    `Mã có hiệu lực trong ${ttlSeconds} giây. Không chia sẻ mã này với bất kỳ ai.\n` +
    "Nếu bạn không yêu cầu mã này, hãy bỏ qua email.",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 12px;color:#2563eb">HOTEL<span style="color:#0f172a">AI</span></h2>
      <p>Mã xác nhận đăng nhập của bạn:</p>
      <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:16px 0">${code}</p>
      <p style="color:#475569">Mã có hiệu lực trong ${ttlSeconds} giây. Không chia sẻ mã này với bất kỳ ai.</p>
      <p style="color:#94a3b8;font-size:12px">Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>
    </div>`,
});

export const sendOtpEmail = async (to, code, ttlSeconds) => {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw httpError(503, "Máy chủ chưa cấu hình gửi email.");
    }

    // Chế độ phát triển: chưa có SMTP thì in mã ra terminal để vẫn đăng nhập được
    console.log(`[DEV] Chưa cấu hình SMTP - mã OTP của ${to}: ${code}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || `HOTELAI <${process.env.SMTP_USER}>`,
      to,
      ...buildOtpEmail(code, ttlSeconds),
    });
  } catch (error) {
    console.error("Gửi email thất bại:", error.message);
    throw httpError(502, "Không gửi được email. Vui lòng thử lại sau.");
  }
};

const PAYMENT_METHOD_LABELS = {
  CASH: "Thanh toán tại khách sạn",
  SEPAY: "SePay Sandbox",
  ZALOPAY: "ZaloPay Sandbox",
  ONLINE: "Thanh toán trực tuyến (cũ)",
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const formatMoney = (value) => new Intl.NumberFormat("vi-VN").format(value);

const buildBookingEmail = (details) => {
  const lookupUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/booking/lookup`;
  const lines = [
    ["Mã đặt phòng", details.bookingCode],
    ["Khách sạn", details.hotelName],
    ["Loại phòng", `${details.roomName} × ${details.rooms}`],
    ["Nhận phòng", details.checkIn],
    ["Trả phòng", details.checkOut],
    ["Số đêm", details.nights],
    ["Số khách", details.guests],
    ["Tổng tiền", `${formatMoney(details.total)}đ`],
    ["Thanh toán", PAYMENT_METHOD_LABELS[details.paymentMethod]],
  ];

  return {
    subject: `Xác nhận đặt phòng ${details.bookingCode} - HOTELAI`,
    text:
      `Xin chào ${details.guestName},\n\nĐặt phòng của bạn đã được xác nhận.\n\n` +
      lines.map(([label, value]) => `${label}: ${value}`).join("\n") +
      `\n\nTra cứu đơn tại ${lookupUrl} bằng mã đặt phòng và email này.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 12px;color:#2563eb">HOTEL<span style="color:#0f172a">AI</span></h2>
        <p>Xin chào ${escapeHtml(details.guestName)}, đặt phòng của bạn đã được xác nhận.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${lines
            .map(
              ([label, value]) =>
                `<tr><td style="padding:6px 0;color:#64748b">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(value)}</td></tr>`,
            )
            .join("")}
        </table>
        <p style="color:#475569">Tra cứu đơn tại <a href="${lookupUrl}">${lookupUrl}</a> bằng mã đặt phòng và email này.</p>
      </div>`,
  };
};

export const sendBookingConfirmation = async (to, details) => {
  if (!isSmtpConfigured()) {
    console.log(`[DEV] Chưa cấu hình SMTP - bỏ qua email xác nhận đặt phòng ${details.bookingCode} gửi tới ${to}`);
    return;
  }

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || `HOTELAI <${process.env.SMTP_USER}>`,
    to,
    ...buildBookingEmail(details),
  });
};
