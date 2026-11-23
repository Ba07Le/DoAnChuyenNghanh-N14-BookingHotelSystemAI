import { Routes, Route } from "react-router-dom";

// ===============================
// WISHLIST CONTEXT
// ===============================
import { WishlistProvider } from "./context/WishlistContext";

// ===============================
// CÁC TRANG CHÍNH
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
// BOOKING / PAYMENT / REVIEWS
// ===============================
import BookingLookup from "./pages/BookingLookup";
import BookingSuccess from "./pages/BookingSuccess";
import PaymentResult from "./pages/PaymentResult";
import MyReviews from "./pages/MyReviews";

// ===============================
// ADMIN
// ===============================
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminHotels from "./pages/admin/AdminHotels";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminCoupons from "./pages/admin/AdminCoupons";

// ===============================
// APP ROUTES
// ===============================
function App() {
  return (
    <WishlistProvider>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/hotels/:slug" element={<HotelDetails />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/offers" element={<Offers />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* CUSTOMER */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* BOOKING - GUEST & CUSTOMER */}
        <Route path="/booking" element={<Booking />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/booking/lookup" element={<BookingLookup />} />
        <Route path="/booking/success" element={<BookingSuccess />} />

        {/* PAYMENT */}
        <Route path="/payment/result" element={<PaymentResult />} />
        <Route path="/payment-result" element={<PaymentResult />} />

        {/* REVIEWS */}
        <Route path="/my-reviews" element={<MyReviews />} />
        <Route path="/reviews" element={<MyReviews />} />
        <Route path="/reviews/mine" element={<MyReviews />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="hotels" element={<AdminHotels />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>
      </Routes>
    </WishlistProvider>
  );
}

export default App;
