import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import { getPaymentStatus } from "../api/paymentApi";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const money = (value) => new Intl.NumberFormat("vi-VN").format(value || 0);
const METHOD_LABELS = { SEPAY: "SePay", ZALOPAY: "ZaloPay" };
const PAYMENT_STATUS_LABELS = {
  PENDING: "Đang chờ xác nhận",
  SUCCEEDED: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
};

export default function PaymentResult() {
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId");
  const provider = params.get("provider")?.toUpperCase();
  const redirectResult = params.get("result");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!bookingId) {
      setError("Không tìm thấy mã đơn đặt phòng trong kết quả trả về.");
      setLoading(false);
      return;
    }

    try {
      const response = await getPaymentStatus(bookingId);
      setResult(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kiểm tra trạng thái thanh toán.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const status = result?.payment?.status;
    if (!bookingId || status === "SUCCEEDED" || status === "FAILED" || status === "REFUNDED") return undefined;

    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [bookingId, result?.payment?.status, refresh]);

  const status = result?.payment?.status;
  const success = status === "SUCCEEDED";
  const failed = status === "FAILED" || status === "REFUNDED";
  const pending = !success && !failed;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-xl px-6 py-16">
        <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
          {loading ? (
            <Clock3 className="mx-auto h-14 w-14 animate-pulse text-amber-500" />
          ) : success ? (
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          ) : failed ? (
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
          ) : (
            <Clock3 className="mx-auto h-16 w-16 text-amber-500" />
          )}

          <h1 className="mt-5 text-2xl font-bold">
            {loading
              ? "Đang kiểm tra thanh toán"
              : success
                ? "Thanh toán thành công"
                : failed
                  ? "Thanh toán chưa thành công"
                  : "Đang chờ xác nhận từ cổng thanh toán"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {success
              ? "Đơn đặt phòng đã được xác nhận."
              : failed
                ? "Giao dịch không thành công hoặc đã được hoàn tiền. Bạn có thể quay lại đơn đặt phòng để kiểm tra."
                : redirectResult === "cancelled"
                  ? "Bạn đã quay lại từ trang thanh toán."
                  : "Vui lòng đợi trong giây lát."}
          </p>

          {result?.payment && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between gap-4 py-1"><span className="text-slate-500">Mã đơn</span><b>{result.booking?.bookingCode || bookingId}</b></div>
              <div className="flex justify-between gap-4 py-1"><span className="text-slate-500">Cổng thanh toán</span><b>{METHOD_LABELS[result.payment.method] || result.payment.method}</b></div>
              <div className="flex justify-between gap-4 py-1"><span className="text-slate-500">Số tiền</span><b>{money(result.payment.amount)}đ</b></div>
              <div className="flex justify-between gap-4 py-1"><span className="text-slate-500">Trạng thái thanh toán</span><b>{PAYMENT_STATUS_LABELS[status] || status}</b></div>
            </div>
          )}

          {pending && !loading && !error && (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-left text-xs leading-5 text-amber-800">
              Nếu bạn đã thanh toán nhưng trạng thái chưa thay đổi, hãy giữ trang này mở và kiểm tra cấu hình IPN/callback trên cổng thanh toán.
            </p>
          )}
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => { setLoading(true); refresh(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">
              <RefreshCw size={16} />Kiểm tra lại
            </button>
            <Link to={result?.booking?.lookupEmail
              ? `/booking/lookup?code=${encodeURIComponent(result.booking.bookingCode)}&email=${encodeURIComponent(result.booking.lookupEmail)}`
              : "/bookings"} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Xem thông tin đặt phòng</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
