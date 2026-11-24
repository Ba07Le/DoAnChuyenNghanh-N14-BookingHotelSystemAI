import { ArrowLeft, CalendarDays, Users, TicketPercent, ShieldCheck, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { createBooking, getBookingQuote } from "../api/bookingApi";
import {
  createSePayPayment,
  createZaloPayPayment,
  redirectToPayment,
} from "../api/paymentApi";
import { getMyProfile } from "../api/userApi";
import BookingSummary from "../components/booking/BookingSummary";
import GuestForm from "../components/booking/GuestForm";
import NumberStepper from "../components/booking/NumberStepper";
import PaymentMethodSelect from "../components/booking/PaymentMethodSelect";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  MAX_ROOMS,
  addDays,
  toInputDate,
  validateContact,
} from "../utils/booking";

function DateField({ label, value, min, onChange }) {
  return (
    <label className="block rounded-2xl bg-slate-50 p-5 text-sm font-medium text-slate-700">
      <span className="sy-co-label"><CalendarDays size={17} />{label}</span>
      <input
        type="date"
        required
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full bg-transparent text-base text-slate-900 outline-none"
      />
    </label>
  );
}

function Notice({ type = "error", children }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-100 bg-blue-50 text-blue-800",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}

/**
 * Trang xác nhận đặt phòng. Khách đã đăng nhập được điền sẵn thông tin từ hồ sơ;
 * khách vãng lai tự nhập họ tên, số điện thoại, email. Giá và tồn phòng luôn lấy từ server.
 */
function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const hotelId = searchParams.get("hotelId");
  const roomTypeId = searchParams.get("roomTypeId");
  const today = toInputDate();

  const [form, setForm] = useState({
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    rooms: Math.max(1, Math.min(MAX_ROOMS, Number(searchParams.get("rooms")) || 1)),
    adults: Math.max(1, Number(searchParams.get("adults")) || 2),
    children: Math.max(0, Number(searchParams.get("children")) || 0),
    paymentMethod: "CASH",
  });
  const contactEdited = useRef({});
  const [contact, setContact] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    note: "",
  });
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [result, setResult] = useState({ key: "", data: null, error: "" });

  // Tham số gửi lên server để xem giá và tồn phòng
  const params = useMemo(
    () => ({
      hotelId,
      roomTypeId,
      checkIn: form.checkIn || undefined,
      checkOut: form.checkOut || undefined,
      rooms: form.rooms,
      adults: form.adults,
      children: form.children,
      couponCode: appliedCoupon || undefined,
    }),
    [
      hotelId,
      roomTypeId,
      form.checkIn,
      form.checkOut,
      form.rooms,
      form.adults,
      form.children,
      appliedCoupon,
    ],
  );
  const requestKey = JSON.stringify([params, refreshCount]);

  // Khách đã đăng nhập: bổ sung thông tin còn thiếu từ hồ sơ cá nhân
  useEffect(() => {
    if (!isAuthenticated) return;

    getMyProfile()
      .then(({ user: profile }) => {
        setContact((prev) => ({
          ...prev,
          fullName: contactEdited.current.fullName ? prev.fullName : profile.fullName || prev.fullName || "",
          email: contactEdited.current.email ? prev.email : profile.email || prev.email || "",
          phone: contactEdited.current.phone ? prev.phone : profile.phone || prev.phone || "",
        }));
      })
      .catch(() => {
        // Không tải được hồ sơ thì giữ thông tin đang có, người dùng vẫn nhập tay được
      });
  }, [isAuthenticated]);

  // Xem giá và tồn phòng mỗi khi ngày, số phòng, số khách hoặc mã ưu đãi thay đổi
  useEffect(() => {
    if (!hotelId || !roomTypeId) return undefined;

    let cancelled = false;

    getBookingQuote(params)
      .then((res) => {
        if (!cancelled)
          setResult({ key: requestKey, data: res.data, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;

        const message =
          err.response?.data?.message ||
          "Không tải được thông tin phòng. Vui lòng thử lại.";

        // Giữ dữ liệu cũ để vẫn hiện được thông tin khách sạn khi chỉ sai ngày
        setResult((prev) => ({
          key: requestKey,
          data: prev.data,
          error: message,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [params, requestKey, hotelId, roomTypeId]);

  const quote = result.data;
  const quoteLoading = result.key !== requestKey;

  if (!hotelId || !roomTypeId || (!quote && !quoteLoading && result.error)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Không tìm thấy phòng cần đặt
          </h1>
          <p className="mt-2 text-slate-500">
            {result.error || "Đường dẫn đặt phòng không đầy đủ."}
          </p>

          <Link
            to="/hotels"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Xem danh sách khách sạn
          </Link>
        </main>

        <Footer />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="h-[32rem] animate-pulse rounded-3xl bg-white" />
          <div className="h-[32rem] animate-pulse rounded-3xl bg-slate-200" />
        </main>
      </div>
    );
  }

  const { capacity: roomCapacity } = quote.roomType;
  const maxGuests = (roomCapacity?.total || 1) * form.rooms;
  const maxRooms = Math.max(
    1,
    Math.min(MAX_ROOMS, quote.availability?.maxRooms ?? MAX_ROOMS),
  );

  const canSubmit =
    Boolean(quote.pricing) &&
    quote.availability?.ok &&
    quote.capacity?.ok &&
    (!appliedCoupon || quote.coupon?.applied) &&
    !quoteLoading &&
    !submitting;

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmitError("");
  };

  const handleCheckInChange = (value) => {
    const needsNewCheckOut = !form.checkOut || form.checkOut <= value;

    updateForm({
      checkIn: value,
      checkOut: !value
        ? ""
        : needsNewCheckOut
          ? addDays(value, 1)
          : form.checkOut,
    });
  };

  // Giảm số phòng thì giảm bớt số khách cho vừa sức chứa (bớt trẻ em trước)
  const handleRoomsChange = (rooms) => {
    const allowed = roomCapacity.total * rooms;
    const children = Math.min(
      form.children,
      Math.max(0, allowed - form.adults),
    );
    const adults = Math.min(form.adults, allowed - children);

    updateForm({ rooms, adults, children });
  };

  const handleContactChange = (name, value) => {
    contactEdited.current[name] = true;
    setContact((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError("");
  };

  const handleApplyCoupon = () =>
    setAppliedCoupon(couponInput.trim().toUpperCase());

  const handleRemoveCoupon = () => {
    setCouponInput("");
    setAppliedCoupon("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const contactErrors = validateContact(contact);

    setErrors(contactErrors);
    if (Object.keys(contactErrors).length || !canSubmit) return;

    try {
      setSubmitting(true);
      setSubmitError("");

      const { data } = await createBooking(
        {
          hotelId,
          roomTypeId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          rooms: form.rooms,
          adults: form.adults,
          children: form.children,
          couponCode: appliedCoupon,
          paymentMethod: form.paymentMethod,
          guestInfo: {
            fullName: contact.fullName.trim(),
            email: contact.email.trim(),
            phone: contact.phone.trim(),
            note: contact.note.trim(),
          },
        },
        { skipAuth: !isAuthenticated },
      );

      if (form.paymentMethod === "CASH") {
        navigate("/booking/success", {
          replace: true,
          state: { booking: data },
        });
        return;
      }

      // Khách vãng lai được thanh toán trực tuyến bằng token một lần do Backend cấp.
      // Token chỉ lưu trong sessionStorage của tab hiện tại để trang kết quả kiểm tra IPN.
      if (!isAuthenticated && data.guestPaymentToken) {
        window.sessionStorage.setItem(
          `guest-payment-token:${data._id}`,
          data.guestPaymentToken,
        );
      }

      const createPayment = {
        SEPAY: createSePayPayment,
        ZALOPAY: createZaloPayPayment,
      }[form.paymentMethod];
      if (!createPayment)
        throw new Error("Phương thức thanh toán không hợp lệ.");

      const paymentResult = await createPayment(
        data._id,
        data.guestPaymentToken,
      );
      redirectToPayment(paymentResult.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setSubmitError(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục đặt phòng.",
        );
      } else {
        setSubmitError(
          err.response?.data?.message ||
            "Không thể đặt phòng. Vui lòng thử lại.",
        );
        // Có thể phòng vừa hết hoặc mã vừa hết lượt: tải lại giá và tồn phòng mới nhất
        setRefreshCount((count) => count + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="sy-co-page mx-auto px-6 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        <header className="sy-co-hero">
          <div><span className="sy-co-kicker">THE ART OF TRAVEL · YOUR RESERVATION</span>
          <h1>Hoàn thiện kỳ nghỉ <em>của bạn.</em></h1>
          <p>{quote.hotel.name} · {quote.roomType.name}</p></div>
          <div className="sy-co-hero-mark"><ShieldCheck size={27}/><span>Xác nhận đặt phòng</span></div>
        </header>
        <div className="sy-co-steps" aria-label="Các phần của biểu mẫu">
          <a href="#sy-co-stay"><span>01</span> Lịch trình</a><a href="#sy-co-guest"><span>02</span> Thông tin khách</a><a href="#sy-co-payment"><span>03</span> Thanh toán</a>
        </div>
        <div className="sy-co-grid">
          <form id="sy-co-form" onSubmit={handleSubmit} className="sy-checkout-form sy-co-form">
            {!isAuthenticated && (
              <Notice type="info">
                Bạn đang đặt phòng với tư cách khách.{" "}
                <Link
                  to="/login"
                  state={{ from: location.pathname + location.search }}
                  className="font-semibold underline"
                >
                  Đăng nhập
                </Link>{" "}
                để tự điền thông tin và xem lại đơn trong tài khoản.
              </Notice>
            )}

            {/* Ngày nhận và trả phòng */}
            <section id="sy-co-stay" className="sy-co-section">
              <div className="sy-co-heading"><CalendarDays size={23}/><div><small>01 · YOUR STAY</small><h2>Lịch trình lưu trú</h2><p>Chọn ngày nhận và trả phòng của bạn.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField
                  label="Nhận phòng"
                  value={form.checkIn}
                  min={today}
                  onChange={handleCheckInChange}
                />
                <DateField
                  label="Trả phòng"
                  value={form.checkOut}
                  min={
                    form.checkIn ? addDays(form.checkIn, 1) : addDays(today, 1)
                  }
                  onChange={(value) => updateForm({ checkOut: value })}
                />
              </div>

              <div className="mt-3 space-y-2">
                {result.error && !quoteLoading && (
                  <Notice>{result.error}</Notice>
                )}
                {quote.availability && !quote.availability.ok && (
                  <Notice>{quote.availability.message}</Notice>
                )}
              </div>
            </section>

            {/* Số phòng và số khách */}
            <section className="sy-co-section">
              <div className="sy-co-heading"><Users size={23}/><div><h2>Phòng và khách lưu trú</h2><p>Điều chỉnh theo nhu cầu chuyến đi.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberStepper
                  label="Số phòng"
                  value={form.rooms}
                  min={1}
                  max={maxRooms}
                  onChange={handleRoomsChange}
                />

                <NumberStepper
                  label="Người lớn"
                  value={form.adults}
                  min={1}
                  max={Math.max(1, maxGuests - form.children)}
                  onChange={(adults) => updateForm({ adults })}
                />

                <NumberStepper
                  label="Trẻ em"
                  value={form.children}
                  min={0}
                  max={Math.max(0, maxGuests - form.adults)}
                  onChange={(children) => updateForm({ children })}
                />
              </div>

              <p className="mt-2 px-1 text-xs text-slate-400">
                {form.rooms} phòng chứa tối đa {maxGuests} khách.
              </p>

              {!quote.capacity.ok && (
                <div className="mt-3">
                  <Notice>{quote.capacity.message}</Notice>
                </div>
              )}
            </section>

            <div id="sy-co-guest" className="sy-co-section"><div className="sy-co-heading"><Users size={23}/><small>02 · GUEST DETAILS</small></div>
            <GuestForm
              contact={contact}
              errors={errors}
              isCustomer={isAuthenticated}
              onChange={handleContactChange}
            />
            </div>

            {/* Mã ưu đãi */}
            <section className="sy-co-section">
              <div className="sy-co-heading"><TicketPercent size={23}/><small>TRAVEL PRIVILEGES</small></div>
              <h2 className="text-lg font-semibold text-slate-900">
                Mã ưu đãi
              </h2>

              <div className="mt-4 flex gap-3">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  maxLength={30}
                  placeholder="Nhập mã ưu đãi"
                  aria-label="Mã ưu đãi"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition-all placeholder:normal-case focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim()}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Áp dụng
                </button>

                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:text-red-600"
                  >
                    Xoá
                  </button>
                )}
              </div>

              <div className="mt-3">
                {quote.coupon && (
                  <Notice type={quote.coupon.applied ? "success" : "error"}>
                    {quote.coupon.message}
                  </Notice>
                )}

                {appliedCoupon && !quote.coupon && !quoteLoading && (
                  <p className="text-xs text-slate-500">
                    Chọn ngày nhận và trả phòng để kiểm tra mã ưu đãi.
                  </p>
                )}
              </div>
            </section>

            <div id="sy-co-payment" className="sy-co-section"><div className="sy-co-heading"><LockKeyhole size={23}/><small>03 · PAYMENT</small></div>
            <PaymentMethodSelect
              value={form.paymentMethod}
              onChange={(paymentMethod) => updateForm({ paymentMethod })}
            />
            </div>

            {submitError && <Notice>{submitError}</Notice>}

            <div className="sy-co-submit">
              <p><ShieldCheck size={18}/> Kiểm tra lại ngày, thông tin khách và tổng tiền trước khi xác nhận.</p>
              <button
                type="submit"
                disabled={!canSubmit}
                className="sy-co-confirm w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Đang xử lý..."
                  : form.paymentMethod === "CASH"
                    ? "Xác nhận đặt phòng"
                    : `Tiếp tục thanh toán ${form.paymentMethod === "SEPAY" ? "SePay" : "ZaloPay"}`}
              </button>

              {!quote.pricing && (
                <p className="mt-2 text-center text-xs text-slate-400">
                  Chọn ngày nhận và trả phòng để đặt phòng.
                </p>
              )}
            </div>
          </form>

          <div className="sy-co-sidebar">
            <BookingSummary quote={quote} form={form} loading={quoteLoading || Boolean(result.error)} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Booking;
