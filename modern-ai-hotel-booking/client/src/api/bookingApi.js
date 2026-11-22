import api from "./apiClient";

// ==========================================
// 1. BÁO GIÁ VÀ KIỂM TRA TỒN PHÒNG
// ==========================================

// Công khai: khách chưa đăng nhập vẫn xem được
export const getBookingQuote = async (params) => {
  const response = await api.get("/bookings/quote", {
    params,
  });

  return response.data;
};

// ==========================================
// 2. TẠO ĐƠN ĐẶT PHÒNG
// ==========================================

// Hỗ trợ khách đã đăng nhập và khách vãng lai.
// skipAuth=true: không gửi JWT khi đặt phòng.
export const createBooking = async (data, { skipAuth = false } = {}) => {
  const response = await api.post(
    "/bookings",
    data,
    skipAuth ? { skipAuth: true } : {},
  );

  return response.data;
};

// ==========================================
// 3. ĐẶT PHÒNG CỦA KHÁCH HÀNG
// ==========================================

// Danh sách đặt phòng của tài khoản
export const getMyBookings = async () => {
  const response = await api.get("/bookings/my");
  return response.data;
};

// Chi tiết một đơn đặt phòng
export const getBooking = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

// Hủy đơn đặt phòng
export const cancelBooking = async (id) => {
  const response = await api.post(`/bookings/${id}/cancel`);
  return response.data;
};

// ==========================================
// 4. THANH TOÁN CŨ CỦA HOTELAI
// ==========================================

// Giữ nguyên API thanh toán cũ (Stripe/MOCK)
export const payBooking = async (id) => {
  const response = await api.post(`/bookings/${id}/pay`);
  return response.data;
};

// ==========================================
// 5. TRA CỨU BOOKING KHÁCH VÃNG LAI
// ==========================================

// Hỗ trợ cả hai cách gọi:
//
// lookupBooking("BK123", "email@gmail.com")
//
// lookupBooking({
//   bookingCode: "BK123",
//   email: "email@gmail.com"
// })
export const lookupBooking = async (bookingCodeOrParams, email) => {
  const params =
    typeof bookingCodeOrParams === "object" && bookingCodeOrParams !== null
      ? bookingCodeOrParams
      : {
          bookingCode: bookingCodeOrParams,
          email,
        };

  const response = await api.get("/bookings/lookup", {
    params,
    skipAuth: true,
  });

  return response.data;
};

// ==========================================
// 6. QUẢN LÝ BOOKING (ADMIN)
// ==========================================

// Lấy tất cả đơn đặt phòng
export const getAllBookings = async () => {
  const response = await api.get("/bookings/admin/all");
  return response.data;
};
