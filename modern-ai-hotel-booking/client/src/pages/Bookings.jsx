import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  CheckCircle2,
  Search, BedDouble, ArrowUpRight, Ticket, Clock, Check, Loader2, Star,
  XCircle,
} from "lucide-react";
import { getMyBookings, cancelBooking } from "../api/bookingApi";
import { createReview, getMyReviews } from "../api/reviewApi";
import ReviewForm from "../components/ReviewForm";
const statusLabels = { PENDING: "Chờ xác nhận", PENDING_PAYMENT: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", CHECKED_IN: "Đã nhận phòng", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy" };
const money = (n) => new Intl.NumberFormat("vi-VN").format(n);
const fmt = (d) => new Date(d).toLocaleDateString("vi-VN");
export default function Bookings() {
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [reviewCheck, setReviewCheck] = useState("loading");
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [actionError, setActionError] = useState("");
  const [data, setData] = useState([]),
    [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const load = () =>
    getMyBookings()
      .then((r) => setData(r.data || []))
      .finally(() => setLoading(false));
  const loadReviews = () => {
    setReviewCheck("loading");
    getMyReviews().then((res) => {
      if (!Array.isArray(res.data)) throw new Error("Invalid reviews");
      setReviewedIds(new Set(res.data.map((r) => String(r.bookingId?._id || r.bookingId))));
      setReviewCheck("ready");
    }).catch(() => setReviewCheck("error"));
  };
  useEffect(() => {
    load().catch(() => setActionError("Không tải được đơn đặt phòng."));
    loadReviews();
  }, []);
  const saveReview = async (values) => {
    if (!reviewBooking || reviewBooking.status !== "COMPLETED") return;
    setSavingReview(true);
    setReviewError("");
    try {
      await createReview({ ...values, bookingId: reviewBooking._id });
      setReviewedIds((prev) => new Set([...prev, String(reviewBooking._id)]));
      setReviewBooking(null);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Không gửi được đánh giá.");
    } finally {
      setSavingReview(false);
    }
  };
  const groups = [
    { key: "all", label: "Tất cả", statuses: null },
    { key: "pending", label: "Đang chờ", statuses: ["PENDING", "PENDING_PAYMENT"] },
    { key: "active", label: "Đã xác nhận", statuses: ["CONFIRMED", "CHECKED_IN"] },
    { key: "completed", label: "Hoàn thành", statuses: ["COMPLETED"] },
    { key: "cancelled", label: "Đã hủy", statuses: ["CANCELLED"] },
  ];
  const norm = (value) => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const group = groups.find((g) => g.key === filter);
  const visible = data.filter((b) => (!group.statuses || group.statuses.includes(b.status)) && norm([b.bookingCode, b.hotelId?.name, b.hotelId?.address?.city, b.roomTypeId?.name].join(" ")).includes(norm(query.trim())));
  const count = (g) => data.filter((b) => !g.statuses || g.statuses.includes(b.status)).length;
  const confirmCancel = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true); setActionError("");
    try { await cancelBooking(cancelTarget._id); setCancelTarget(null); await load(); }
    catch (err) { setActionError(err.response?.data?.message || "Không thể hủy đơn."); setCancelTarget(null); }
    finally { setCancelling(false); }
  };
  return (
    <section className="sy-bookings sy-trip-page" aria-label="Đơn đặt phòng của tôi">
      <header className="sy-trip-heading">
        <div><p className="sy-trip-kicker">YOUR JOURNEY · MY TRIPS</p><h2>Đơn đặt phòng của tôi</h2><p>Theo dõi và quản lý những hành trình đáng nhớ.</p></div>
        <Link to="/hotels" className="sy-trip-primary">Khám phá khách sạn <ArrowUpRight size={17}/></Link>
      </header>
      <div className="sy-trip-stats" aria-label="Tổng quan đặt phòng">
        {[{ label: "Tổng đơn", value: data.length, Icon: Ticket }, { label: "Đang chờ", value: count(groups[1]), Icon: Clock }, { label: "Đã xác nhận / nhận phòng", value: count(groups[2]), Icon: CalendarDays }, { label: "Hoàn thành", value: count(groups[3]), Icon: CheckCircle2 }].map(({label,value,Icon}) => <div key={label}><span className="sy-trip-stat-icon"><Icon size={19}/></span><strong>{loading ? "—" : value}</strong><span>{label}</span></div>)}
      </div>
      <div className="sy-trip-toolbar">
        <div className="sy-trip-tabs" aria-label="Lọc trạng thái">{groups.map(g => <button type="button" key={g.key} aria-pressed={filter===g.key} onClick={()=>setFilter(g.key)}>{g.label} <span>{count(g)}</span></button>)}</div>
        <label className="sy-trip-search"><Search size={18}/><input aria-label="Tìm đơn đặt phòng" placeholder="Tìm mã đơn, khách sạn, điểm đến..." value={query} onChange={e=>setQuery(e.target.value)}/>{query && <button type="button" aria-label="Xóa tìm kiếm" onClick={()=>setQuery("")}><XCircle size={17}/></button>}</label>
      </div>
      {actionError && <div className="sy-trip-error" role="alert">{actionError}<button type="button" onClick={()=>{setActionError("");setLoading(true);load().catch(()=>setActionError("Không tải được đơn đặt phòng."));}}>Tải lại</button></div>}
      {loading ? <div className="sy-trip-list" role="status" aria-label="Đang tải đơn đặt phòng">{[1,2].map(i=><div key={i} className="sy-trip-skeleton"/>)}</div> : <>
        <p className="sy-trip-result">{visible.length} đơn đặt phòng</p>
        <div className="sy-trip-list">{visible.map(b => <article key={b._id} className="sy-trip-card">
          <div className="sy-trip-card-top"><span><Ticket size={15}/> {b.bookingCode}</span><span className="sy-trip-status" data-status={b.status}>{statusLabels[b.status] || b.status}</span></div>
          <div className="sy-trip-card-body">
            <div className="sy-trip-photo">{b.hotelId?.images?.[0]?.url ? <img src={b.hotelId.images[0].url} alt={b.hotelId?.name || "Khách sạn"} onError={e=>{e.currentTarget.style.display="none";}}/> : null}<BedDouble size={32} className="sy-trip-photo-fallback"/></div>
            <div className="sy-trip-info"><div className="sy-trip-location"><MapPin size={15}/>{b.hotelId?.address?.city || ""}</div><h3>{b.hotelId?.name || "Khách sạn"}</h3><p className="sy-trip-room"><BedDouble size={17}/>{b.roomTypeId?.name}</p>
            <div className="sy-trip-dates"><div><small>Nhận phòng</small><strong><CalendarDays size={16}/>{fmt(b.checkIn)}</strong></div><span className="sy-trip-date-arrow">→</span><div><small>Trả phòng</small><strong><CalendarDays size={16}/>{fmt(b.checkOut)}</strong></div></div></div>
          </div>
          <div className="sy-trip-card-bottom"><div><small>Tổng tiền đặt phòng</small><strong>{money(b.totalAmount)}đ</strong></div><div className="sy-trip-actions">
            {b.status === "COMPLETED" && reviewCheck === "loading" && <span className="sy-trip-secondary"><Loader2 size={16} className="animate-spin"/> Đang kiểm tra đánh giá</span>}
            {b.status === "COMPLETED" && reviewCheck === "error" && <button type="button" className="sy-trip-secondary" onClick={loadReviews}>Kiểm tra lại đánh giá</button>}
            {b.status === "COMPLETED" && reviewCheck === "ready" && !reviewedIds.has(String(b._id)) && (b.hotelId?.slug ? <Link className="sy-trip-primary" to={`/hotels/${encodeURIComponent(b.hotelId.slug)}?reviewBookingId=${encodeURIComponent(b._id)}#sy-hd-reviews`}><Star size={17}/> Đánh giá khách sạn</Link> : <button type="button" className="sy-trip-primary" onClick={()=>{setReviewError("");setReviewBooking(b);}}><Star size={17}/> Đánh giá khách sạn</button>)}
            {b.status === "COMPLETED" && reviewCheck === "ready" && reviewedIds.has(String(b._id)) && <Link to="/my-reviews" className="sy-trip-secondary"><Check size={16}/> Đã đánh giá · Xem lại</Link>}
            {b.status !== "CANCELLED" && b.status !== "COMPLETED" && <button type="button" className="sy-trip-cancel" onClick={()=>setCancelTarget(b)}><XCircle size={16}/> Hủy đơn</button>}
            <Link to={`/hotels/${b.hotelId?.slug}`} className="sy-trip-primary">Xem khách sạn <ArrowUpRight size={16}/></Link>
          </div></div>
        </article>)}</div>
        {!visible.length && !actionError && <div className="sy-trip-empty"><span><Ticket size={30}/></span><h3>{data.length ? "Không tìm thấy đơn phù hợp" : "Bạn chưa có đơn đặt phòng"}</h3><p>{data.length ? "Thử từ khóa hoặc trạng thái khác." : "Khám phá nơi lưu trú cho hành trình tiếp theo của bạn."}</p>{data.length ? <button type="button" className="sy-trip-secondary" onClick={()=>{setFilter("all");setQuery("");}}>Xóa bộ lọc</button> : <Link to="/hotels" className="sy-trip-primary">Khám phá khách sạn <ArrowUpRight size={16}/></Link>}</div>}
      </>}
      {cancelTarget && <div className="sy-trip-modal-backdrop" onClick={()=>!cancelling && setCancelTarget(null)}><div className="sy-trip-modal" role="dialog" aria-modal="true" aria-labelledby="sy-trip-cancel-title" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==="Escape"&&!cancelling)setCancelTarget(null);}}><span className="sy-trip-modal-icon"><XCircle size={28}/></span><h3 id="sy-trip-cancel-title">Xác nhận hủy đơn đặt phòng?</h3><p>Đơn {cancelTarget.bookingCode} tại {cancelTarget.hotelId?.name}. Bạn có chắc muốn hủy đơn này?</p><div className="sy-trip-actions"><button autoFocus type="button" className="sy-trip-secondary" disabled={cancelling} onClick={()=>setCancelTarget(null)}>Giữ đơn</button><button type="button" className="sy-trip-danger" disabled={cancelling} onClick={confirmCancel}>{cancelling && <Loader2 size={16} className="animate-spin"/>}{cancelling ? "Đang hủy..." : "Xác nhận hủy"}</button></div></div></div>}
      {reviewBooking && <ReviewForm hotelName={reviewBooking.hotelId?.name} submitting={savingReview} error={reviewError} onSubmit={saveReview} onClose={() => setReviewBooking(null)} />}
    </section>
  );
}
