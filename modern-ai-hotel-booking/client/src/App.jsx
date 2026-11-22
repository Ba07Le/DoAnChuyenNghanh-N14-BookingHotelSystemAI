import { Route, Routes } from "react-router-dom";

// ===============================
// LAYOUT
// ===============================
import AccountLayout from "./layouts/AccountLayout";

// ===============================
// CÁC TRANG HOTELAI
// ===============================
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Hotels from "./pages/Hotels";
import Offers from "./pages/Offers";
import Destinations from "./pages/Destinations";
import HotelDetails from "./pages/HotelDetails";
import Booking from "./pages/Booking";
import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";

// ===============================
// CHỨC NĂNG BỔ SUNG TỪ HIẾU
// ===============================
import ManagerLogin from "./pages/ManagerLogin";
import MyReviews from "./pages/MyReviews";
import BookingLookup from "./pages/BookingLookup";
import BookingSuccess from "./pages/BookingSuccess";
import PaymentResult from "./pages/PaymentResult";

// ===============================
// HOTEL OWNER - DŨNG
// ===============================
import HotelOwner from "./pages/HotelOwner";

// ===============================
// ADMIN - TUẤN ANH
// ===============================
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminHotels from "./pages/admin/AdminHotels";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

function App() {
  return (
    <Routes>
      {/* ===========================
          TRANG CÔNG KHAI
      =========================== */}
      <Route path="/" element={<Home />} />
      <Route path="/hotels" element={<Hotels />} />
      <Route path="/hotels/:slug" element={<HotelDetails />} />
      <Route path="/destinations" element={<Destinations />} />
      <Route path="/offers" element={<Offers />} />

      {/* ===========================
          ĐĂNG KÝ / ĐĂNG NHẬP
      =========================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Manager / Staff */}
      <Route path="/manager/login" element={<ManagerLogin />} />
      <Route path="/staff/login" element={<ManagerLogin />} />

      {/* ===========================
          ĐẶT PHÒNG VÀ THANH TOÁN
      =========================== */}
      <Route path="/booking" element={<Booking />} />

      <Route path="/booking/success" element={<BookingSuccess />} />

      <Route path="/booking/lookup" element={<BookingLookup />} />

      <Route path="/payment/result" element={<PaymentResult />} />

      {/* ===========================
          DASHBOARD HIỆN TẠI
      =========================== */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* ===========================
          HOTEL OWNER - DŨNG
      =========================== */}
      <Route path="/hotel-owner" element={<HotelOwner />} />

      {/* ===========================
          TÀI KHOẢN KHÁCH HÀNG
      =========================== */}
      <Route element={<AccountLayout />}>
        <Route path="/profile" element={<Profile />} />

        <Route path="/bookings" element={<Bookings />} />

        <Route path="/wishlist" element={<Wishlist />} />

        <Route path="/notifications" element={<Notifications />} />

        <Route path="/reviews" element={<MyReviews />} />
      </Route>

      {/* ===========================
          ADMIN - TUẤN ANH
      =========================== */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        {/* Dashboard Admin */}
        <Route index element={<AdminDashboard />} />

        {/* Quản lý người dùng */}
        <Route path="users" element={<AdminUsers />} />

        {/* Quản lý khách sạn */}
        <Route path="hotels" element={<AdminHotels />} />

        {/* Quản lý đặt phòng */}
        <Route path="bookings" element={<AdminBookings />} />

        {/* Quản lý mã giảm giá */}
        <Route path="coupons" element={<AdminCoupons />} />

        {/* Nhật ký hoạt động */}
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>
    </Routes>
  );
}

export default App;
