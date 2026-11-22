
import { Route, Routes } from "react-router-dom";

// Layout
import AccountLayout from "./layouts/AccountLayout";

// Các trang HOTELAI hiện tại
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

// Các trang bổ sung từ Hiếu
import ManagerLogin from "./pages/ManagerLogin";
import MyReviews from "./pages/MyReviews";
import BookingLookup from "./pages/BookingLookup";
import BookingSuccess from "./pages/BookingSuccess";
import PaymentResult from "./pages/PaymentResult";

// Trang quản lý khách sạn của Dũng
import HotelOwner from "./pages/HotelOwner";

function App() {
  return (
    <Routes>
      {/* TRANG CÔNG KHAI */}
      <Route path="/" element={<Home />} />
      <Route path="/hotels" element={<Hotels />} />
      <Route path="/hotels/:slug" element={<HotelDetails />} />
      <Route path="/destinations" element={<Destinations />} />
      <Route path="/offers" element={<Offers />} />

      {/* ĐĂNG KÝ / ĐĂNG NHẬP */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ĐĂNG NHẬP MANAGER / STAFF */}
      <Route path="/manager/login" element={<ManagerLogin />} />
      <Route path="/staff/login" element={<ManagerLogin />} />

      {/* ĐẶT PHÒNG VÀ THANH TOÁN */}
      <Route path="/booking" element={<Booking />} />
      <Route
        path="/booking/success"
        element={<BookingSuccess />}
      />
      <Route
        path="/booking/lookup"
        element={<BookingLookup />}
      />
      <Route
        path="/payment/result"
        element={<PaymentResult />}
      />

      {/* DASHBOARD */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* QUẢN LÝ KHÁCH SẠN - HOTEL OWNER */}
      <Route
        path="/hotel-owner"
        element={<HotelOwner />}
      />

      {/* TRANG TÀI KHOẢN KHÁCH HÀNG */}
      <Route element={<AccountLayout />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route
          path="/notifications"
          element={<Notifications />}
        />
        <Route path="/reviews" element={<MyReviews />} />
      </Route>
    </Routes>
  );
}

export default App;
