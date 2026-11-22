const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_ROOMS = 5;

export const formatMoney = (value) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

// Nhận cả chuỗi YYYY-MM-DD (từ ô chọn ngày) và chuỗi ngày giờ của server
export const formatDate = (value) =>
  new Date(DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00` : value).toLocaleDateString("vi-VN");

// Ngày dạng YYYY-MM-DD theo giờ máy người dùng, dùng cho ô chọn ngày
export const toInputDate = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

export const addDays = (inputDate, days) => {
  const date = new Date(`${inputDate}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toInputDate(date);
};

export const BOOKING_STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  PENDING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đang lưu trú",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

export const PAYMENT_STATUS_LABELS = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_METHOD_LABELS = {
  CASH: "Thanh toán tại khách sạn",
  SEPAY: "SePay Sandbox",
  ZALOPAY: "ZaloPay Sandbox",
  // Giữ nhãn dữ liệu cũ để các đơn đã tạo trước đây vẫn hiển thị được.
  ONLINE: "Thanh toán trực tuyến (cũ)",
  MOCK: "Thanh toán trực tuyến (cũ)",
  STRIPE: "Thanh toán trực tuyến (cũ)",
};

// Số điện thoại Việt Nam: bỏ ký tự phân cách, đổi +84 / 84 thành 0 (giống quy tắc ở server)
const normalizePhone = (value) => {
  const digits = value.replace(/[\s.\-()]/g, "");

  if (digits.startsWith("+84")) return `0${digits.slice(3)}`;
  if (/^84\d{9,10}$/.test(digits)) return `0${digits.slice(2)}`;

  return digits;
};

// Kiểm tra thông tin người nhận phòng; trả về { tênTrường: "thông báo lỗi" }
export const validateContact = ({ fullName, email, phone }) => {
  const errors = {};

  if (fullName.trim().length < 2) errors.fullName = "Vui lòng nhập họ và tên.";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Email không hợp lệ.";
  if (!/^0\d{9,10}$/.test(normalizePhone(phone.trim()))) errors.phone = "Số điện thoại phải gồm 10–11 chữ số.";

  return errors;
};
