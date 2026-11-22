import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { PAYMENT_METHOD_LABELS, formatDate, formatMoney } from "../utils/booking";

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-6 py-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

// Màn hình sau khi đặt phòng thành công (dữ liệu đơn được truyền qua điều hướng)
function BookingSuccess() {
  const { state } = useLocation();
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  const booking = state?.booking;

  if (!booking) return <Navigate to="/" replace />;

  const { guestInfo } = booking;
  const lookupUrl = `/booking/lookup?code=${encodeURIComponent(booking.bookingCode)}&email=${encodeURIComponent(guestInfo.email)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(booking.bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt không cho sao chép tự động thì người dùng tự chọn mã trên màn hình
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="text-center">
            <CheckCircle2 size={56} className="mx-auto text-emerald-500" />

            <h1 className="mt-4 text-3xl font-bold text-slate-900">Đặt phòng thành công</h1>

            <p className="mt-2 text-sm text-slate-500">
              Chúng tôi sẽ gửi thông tin xác nhận tới <span className="font-medium text-slate-700">{guestInfo.email}</span>.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-5 py-4">
            <div>
              <p className="text-xs text-slate-500">Mã đặt phòng</p>
              <p className="mt-1 text-lg font-bold tracking-wide text-slate-900">{booking.bookingCode}</p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Copy size={14} />
              {copied ? "Đã sao chép" : "Sao chép"}
            </button>
          </div>

          <dl className="mt-4 divide-y divide-slate-100">
            <Row label="Khách sạn" value={booking.hotelId?.name} />
            <Row label="Loại phòng" value={`${booking.roomTypeId?.name} × ${booking.rooms}`} />
            <Row label="Nhận phòng" value={formatDate(booking.checkIn)} />
            <Row label="Trả phòng" value={formatDate(booking.checkOut)} />
            <Row label="Số khách" value={booking.guests.adults + booking.guests.children} />
            <Row label="Người nhận phòng" value={guestInfo.fullName} />
            <Row label="Thanh toán" value={PAYMENT_METHOD_LABELS[booking.paymentMethod]} />
            <Row label="Tổng tiền" value={formatMoney(booking.totalAmount)} />
          </dl>

          <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {booking.paymentMethod === "CASH"
              ? "Bạn thanh toán trực tiếp tại khách sạn khi nhận phòng."
              : "Đơn của bạn đã được giữ chỗ và đang chờ thanh toán."}
            {!isAuthenticated && " Hãy lưu lại mã đặt phòng để tra cứu đơn khi cần."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Link
                to="/bookings"
                className="flex-1 rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                Xem đặt phòng của tôi
              </Link>
            ) : (
              <Link
                to={lookupUrl}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tra cứu đặt phòng
              </Link>
            )}

            <Link
              to="/"
              className="flex-1 rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BookingSuccess;
