import { CalendarDays, Clock3, ShieldCheck, Users } from "lucide-react";
import { formatDate, formatMoney } from "../../utils/booking";

// Tóm tắt đơn đặt phòng: phòng, ngày ở, số khách và bảng giá do server tính
function BookingSummary({ quote, form, loading }) {
  const { hotel, roomType, pricing, nights } = quote;
  const hasDates = Boolean(form.checkIn && form.checkOut);

  return (
    <aside className="sy-booking-summary rounded-3xl bg-slate-900 p-5 sm:p-6 text-white shadow-xl shadow-slate-900/10 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none">
      {hotel.image && (
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="h-36 sm:h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      <div className="mt-3.5">
        <h2 className="text-lg sm:text-xl font-bold leading-snug">{hotel.name}</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
          {roomType.name}
          {hotel.city && ` · ${hotel.city}`}
        </p>
      </div>

      <ul className="mt-3.5 space-y-2 text-xs sm:text-sm text-slate-300">
        <li className="flex items-center gap-2.5">
          <CalendarDays size={16} className="shrink-0 text-blue-400" />
          <span className="truncate">
            {hasDates
              ? `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)}${nights ? ` (${nights} đêm)` : ""}`
              : "Chọn ngày nhận và trả phòng"}
          </span>
        </li>

        <li className="flex items-center gap-2.5">
          <Users size={16} className="shrink-0 text-blue-400" />
          <span>
            {form.rooms} phòng · {form.adults + form.children} khách (tối đa {roomType.capacity.total} khách/phòng)
          </span>
        </li>

        {hotel.checkInTime && hotel.checkOutTime && (
          <li className="flex items-center gap-2.5">
            <Clock3 size={16} className="shrink-0 text-blue-400" />
            <span>
              Nhận {hotel.checkInTime} · Trả {hotel.checkOutTime}
            </span>
          </li>
        )}

        {hotel.cancellationPolicy && (
          <li className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
            <span className="truncate">{hotel.cancellationPolicy}</span>
          </li>
        )}
      </ul>

      <div className="mt-4 border-t border-slate-800 pt-3.5">
        {pricing ? (
          <>
            <div className="flex justify-between gap-4 text-xs sm:text-sm text-slate-300">
              <span>
                Giá phòng · {pricing.nights} đêm × {pricing.rooms} phòng
              </span>
              <span>{formatMoney(pricing.subtotal)}</span>
            </div>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Trung bình {formatMoney(pricing.pricePerNight)} / đêm / phòng
            </p>

            {pricing.discount > 0 && (
              <div className="mt-2 flex justify-between gap-4 text-xs sm:text-sm text-emerald-400">
                <span>Mã ưu đãi {pricing.couponCode}</span>
                <span>-{formatMoney(pricing.discount)}</span>
              </div>
            )}

            <div className="mt-3 flex items-baseline justify-between gap-4">
              <span className="text-xs sm:text-sm text-slate-400">Tổng cộng</span>
              <span className="text-2xl font-bold text-white">{formatMoney(pricing.total)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-slate-400">Giá phòng</span>
              <p className="text-xl sm:text-2xl font-bold">
                {formatMoney(roomType.basePrice)}{" "}
                <span className="text-xs font-normal text-slate-400">/ đêm</span>
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-400">Chọn ngày nhận và trả phòng để xem tổng tiền.</p>
          </>
        )}

        {loading && <p className="mt-2 text-xs text-blue-400 animate-pulse">Đang cập nhật giá...</p>}
      </div>
    </aside>
  );
}

export default BookingSummary;
