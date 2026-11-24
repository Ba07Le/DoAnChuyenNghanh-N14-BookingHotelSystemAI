import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { lookupBooking } from "../api/bookingApi";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatMoney,
} from "../utils/booking";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-6 py-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

/**
 * Tra cứu đơn đặt phòng bằng mã đặt phòng và email (dành cho khách vãng lai).
 * Mở từ link trong email xác nhận (?code=...&email=...) thì tự tra cứu ngay.
 */
function BookingLookup() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const initialEmail = searchParams.get("email") || "";

  const [form, setForm] = useState({ code: initialCode, email: initialEmail });
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(initialCode && initialEmail));

  const runLookup = useCallback(async (code, email) => {
    try {
      const { data } = await lookupBooking({
        code: code.trim(),
        email: email.trim(),
      });

      setBooking(data);
      setError("");
    } catch (err) {
      setBooking(null);
      setError(
        err.response?.data?.message ||
          "Không thể tra cứu lúc này. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCode && initialEmail) runLookup(initialCode, initialEmail);
  }, [initialCode, initialEmail, runLookup]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setLoading(true);
    runLookup(form.code, form.email);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Tra cứu đặt phòng</h1>
        <p className="mt-2 text-sm text-slate-500">
          Nhập mã đặt phòng và email đã dùng khi đặt phòng.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-medium text-slate-700">
            Mã đặt phòng
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="HTL-20261120-ABC123"
              className={`${inputClass} uppercase placeholder:normal-case`}
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ban@example.com"
              className={inputClass}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Đang tra cứu..." : "Tra cứu"}
          </button>
        </form>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {booking && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            {booking.hotel?.images?.[0]?.url && (
              <img
                src={booking.hotel.images[0].url}
                alt={booking.hotel.name}
                className="h-44 w-full object-cover"
              />
            )}

            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-600">
                    {booking.bookingCode}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {booking.hotel?.name}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    booking.status === "CANCELLED"
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                </span>
              </div>

              <dl className="mt-4 divide-y divide-slate-100">
                <Row
                  label="Loại phòng"
                  value={`${booking.roomType?.name} × ${booking.rooms}`}
                />
                <Row label="Nhận phòng" value={formatDate(booking.checkIn)} />
                <Row label="Trả phòng" value={formatDate(booking.checkOut)} />
                <Row
                  label="Số khách"
                  value={booking.guests.adults + booking.guests.children}
                />
                <Row label="Người nhận phòng" value={booking.guestName} />
                <Row
                  label="Thanh toán"
                  value={`${PAYMENT_METHOD_LABELS[booking.payment?.method] ?? "—"} · ${
                    PAYMENT_STATUS_LABELS[booking.paymentStatus] ??
                    booking.paymentStatus
                  }`}
                />
                {booking.discount > 0 && (
                  <Row
                    label={`Giảm giá (${booking.couponCode})`}
                    value={`-${formatMoney(booking.discount)}`}
                  />
                )}
                <Row
                  label="Tổng tiền"
                  value={formatMoney(booking.totalAmount)}
                />
              </dl>

              <p className="mt-4 text-xs text-slate-500">
                Cần huỷ hoặc thay đổi đơn? Vui lòng liên hệ khách sạn, hoặc{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:underline"
                >
                  đăng nhập
                </Link>{" "}
                bằng tài khoản đã đặt phòng.
              </p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default BookingLookup;
