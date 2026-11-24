import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, MapPin, Star, Heart, CalendarDays, Users, BedDouble, Maximize, Images, Building2, CheckCircle2, Clock, ShieldCheck, MessageSquare, RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImageLightbox from "../components/ImageLightbox";
import ReviewCard from "../components/ReviewCard";
import ReviewForm from "../components/ReviewForm";
import { useAuth } from "../context/AuthContext";
import { getMyBookings } from "../api/bookingApi";
import { getHotelReviews, getMyReviews, createReview } from "../api/reviewApi";
import { getHotelBySlug } from "../api/hotelApi";
import { useWishlist } from "../context/WishlistContext";
import { getImageUrl } from "../utils/imageUrl";

const money = n => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
const photos = list => [...new Set((list || []).map(i => getImageUrl(typeof i === "string" ? i : i?.url)).filter(Boolean))];
const priceValid = n => n != null && n !== "" && Number.isFinite(Number(n)) && Number(n) >= 0;
function Photo({ src, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? <img src={src} alt={alt} onError={() => setFailed(true)} /> : <div className="sy-hd-placeholder"><Building2 size={38}/><span>Chưa có hình ảnh</span></div>;
}
export default function HotelDetails() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const reviewBookingId = searchParams.get("reviewBookingId") || "";
  const travelParams = new URLSearchParams(searchParams);
  travelParams.delete("reviewBookingId");
  const suffix = travelParams.toString() ? `?${travelParams.toString()}` : "";
  const { isLiked, toggleLike } = useWishlist();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wishError, setWishError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true); setData(null); setError(""); setLightbox(null); setWishError("");
    getHotelBySlug(slug).then(r => { if (active) { setData(r.data); if (!r.data) setError("Không tìm thấy khách sạn."); } })
      .catch(e => { if (active) setError(e.response?.data?.message || "Không thể tải thông tin khách sạn."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, retry]);
  useEffect(() => {
    if (!lightbox) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [Boolean(lightbox)]);
  const jump = id => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const openPhotos = (images, index=0) => { if (images.length) setLightbox({ images, index }); };
  const book = room => {
    const params = new URLSearchParams(travelParams);
    params.set("hotelId", data.hotel._id); params.set("roomTypeId", room._id);
    nav(`/booking?${params.toString()}`);
  };
  const toggle = async () => {
    setSaving(true); setWishError("");
    try { const ok = await toggleLike(data.hotel._id); if (!ok) setWishError("Không thể cập nhật yêu thích. Vui lòng thử lại."); }
    catch { setWishError("Không thể cập nhật yêu thích. Vui lòng thử lại."); }
    finally { setSaving(false); }
  };
  const hotel = data?.hotel;
  const rooms = data?.roomTypes || [];
  const [reviewSummary, setReviewSummary] = useState(null);
  const gallery = photos(hotel?.images);
  const prices = rooms.map(r=>r.basePrice).filter(priceValid).map(Number);
  const from = prices.length ? Math.min(...prices) : null;
  const address = [hotel?.address?.addressLine, hotel?.address?.city].filter(Boolean).join(", ");
  const hasReviewSummary = reviewSummary != null && hotel != null && reviewSummary.hotelId === hotel._id;
  const rating = hasReviewSummary ? Number(reviewSummary.average) || 0 : Number(hotel?.averageRating) || 0;
  const count = hasReviewSummary ? Number(reviewSummary.count) || 0 : Number(hotel?.reviewCount) || 0;
  const policies = hotel?.policies || {};
  const policyRows = [["Nhận phòng",policies.checkInTime],["Trả phòng",policies.checkOutTime],["Hủy phòng",policies.cancellationPolicy],["Trẻ em",policies.childPolicy],["Thú cưng",policies.petPolicy]].filter(([,v])=>v);
  return <div className="sy-hd-page"><Navbar/><main className="sy-hd-wrap">
    <Link className="sy-hd-back" to={`/hotels${suffix}`}><ArrowLeft size={17}/> Quay lại danh sách khách sạn</Link>
    {loading ? <div className="sy-hd-loading" role="status">Đang tải thông tin khách sạn…</div> : !hotel ? <div className="sy-hd-empty"><Building2 size={38}/><h1>{error || "Không tìm thấy khách sạn"}</h1><button className="sy-hd-primary" onClick={()=>setRetry(v=>v+1)}><RefreshCw size={16}/> Thử lại</button></div> : <>
      <header className="sy-hd-header"><div><div className="sy-hd-kicker">THE SEEYAHH! COLLECTION · {hotel.hotelTypeId?.name || hotel.hotelType}</div><h1>{hotel.name}</h1><div className="sy-hd-meta"><span><MapPin size={17}/>{address || hotel.destinationId?.name || "Chưa cập nhật địa chỉ"}</span>{Number(hotel.starRating)>0 && <span className="sy-hd-stars" aria-label={`${hotel.starRating} sao`}>{"★".repeat(Math.min(5,Math.max(0,Math.round(Number(hotel.starRating)))))}</span>}</div></div><button className={`sy-hd-wish ${isLiked(hotel._id)?"is-liked":""}`} aria-pressed={isLiked(hotel._id)} disabled={saving} onClick={toggle}><Heart size={19} fill={isLiked(hotel._id)?"currentColor":"none"}/>{isLiked(hotel._id)?"Đã lưu":"Lưu yêu thích"}</button></header>
      {wishError && <p role="alert" className="sy-hd-error">{wishError}</p>}
      <section className={`sy-hd-gallery sy-hd-gallery-${Math.min(gallery.length,5)}`} aria-label="Hình ảnh khách sạn">
        {gallery.length ? gallery.slice(0,5).map((src,i)=><button key={src} className="sy-hd-photo" onClick={()=>openPhotos(gallery,i)} aria-label={`Xem ảnh khách sạn ${i+1}`}><Photo src={src} alt={`${hotel.name} – ảnh ${i+1}`}/></button>) : <Photo alt={hotel.name}/>}
        {gallery.length>0 && <button className="sy-hd-allphotos" onClick={()=>openPhotos(gallery)}><Images size={18}/> Xem tất cả {gallery.length} ảnh</button>}
      </section>
      <nav className="sy-hd-tabs" aria-label="Nội dung khách sạn">{[["sy-hd-overview","Tổng quan"],["sy-hd-amenities","Tiện nghi"],["sy-hd-rooms","Loại phòng"],["sy-hd-reviews","Đánh giá"],...(policyRows.length?[["sy-hd-policies","Chính sách"]]:[])].map(([id,label])=><button key={id} onClick={()=>jump(id)}>{label}</button>)}</nav>
      <div className="sy-hd-introgrid"><div><section id="sy-hd-overview" className="sy-hd-section"><p className="sy-hd-kicker">01 — THE EXPERIENCE</p><h2>Không gian nghỉ dưỡng của bạn.</h2><p className="sy-hd-description">{hotel.description || "Thông tin giới thiệu đang được cập nhật."}</p></section><section id="sy-hd-amenities" className="sy-hd-section"><p className="sy-hd-kicker">02 — COMFORT & CONVENIENCE</p><h2>Tiện nghi nổi bật</h2><div className="sy-hd-amenities">{(hotel.amenities || []).map((a,i)=><span key={a._id || i}><CheckCircle2 size={17}/>{a.name}</span>)}</div>{!hotel.amenities?.length && <p>Tiện nghi đang được cập nhật.</p>}</section></div>
      <aside className="sy-hd-aside"><div className="sy-hd-reserve"><p className="sy-hd-kicker">YOUR NEXT ESCAPE</p><span>Giá phòng từ</span><div className="sy-hd-price">{from===null?"Liên hệ":money(from)} <small>{from!==null?"/ đêm":""}</small></div><div className="sy-hd-rating"><Star size={20}/><div><strong>{count>0?`${rating}/5` : "Chưa có đánh giá"}</strong>{count>0&&<p>{count} đánh giá tổng hợp</p>}</div></div><button className="sy-hd-primary" onClick={()=>jump("sy-hd-rooms")}>Khám phá loại phòng <ArrowUpRight size={18}/></button><p className="sy-hd-note"><ShieldCheck size={16}/> Giá và phòng trống được xác nhận khi đặt phòng.</p></div></aside></div>
      <section id="sy-hd-rooms" className="sy-hd-section"><p className="sy-hd-kicker">03 — STAY IN STYLE</p><h2>Chọn không gian dành cho bạn.</h2><p className="sy-hd-description">{rooms.length} loại phòng · Chọn phòng phù hợp với hành trình của bạn.</p><div className="sy-hd-rooms">{rooms.map(room=>{const images=photos(room.images); return <article className="sy-hd-room" key={room._id}><button className="sy-hd-roomphoto" onClick={()=>openPhotos(images)} disabled={!images.length} aria-label={`Xem ảnh ${room.name}`}><Photo src={images[0]} alt={room.name}/>{images.length>0&&<span><Images size={15}/> {images.length} ảnh phòng</span>}</button><div className="sy-hd-roominfo"><div className="sy-hd-kicker">ROOM COLLECTION</div><h3>{room.name}</h3><div className="sy-hd-features">{room.size>0&&<span><Maximize size={17}/>{room.size} m²</span>}{room.bedType&&<span><BedDouble size={17}/>{room.bedType}</span>}{room.capacity?.total!=null&&<span><Users size={17}/>Tối đa {room.capacity.total} khách</span>}</div>{room.capacity?.adults!=null&&<p className="sy-hd-note">{room.capacity.adults} người lớn{room.capacity.children>0?` · ${room.capacity.children} trẻ em`:""}</p>}{room.description&&<p className="sy-hd-description">{room.description}</p>}<div className="sy-hd-roomamenities">{(room.amenities||[]).map((a,i)=><span key={a._id||i}>{a.name}</span>)}</div></div><div className="sy-hd-roomaction"><span>Giá mỗi đêm</span><strong>{priceValid(room.basePrice)?money(room.basePrice):"Liên hệ"}</strong><button className="sy-hd-primary" onClick={()=>book(room)}>Đặt phòng <ArrowUpRight size={17}/></button><small>Kiểm tra tình trạng phòng ở bước tiếp theo</small></div></article>})}</div>{!rooms.length&&<div className="sy-hd-empty"><BedDouble size={32}/>Chưa có loại phòng được công bố.</div>}</section>
      <HotelGuestReviews key={hotel._id} hotel={hotel} onSummary={setReviewSummary} requestedBookingId={reviewBookingId}/>

      {policyRows.length>0&&<section id="sy-hd-policies" className="sy-hd-section"><p className="sy-hd-kicker">05 — GOOD TO KNOW</p><h2>Thông tin trước chuyến đi</h2><div className="sy-hd-policies">{policyRows.map(([k,v])=><div key={k}><Clock size={18}/><div><strong>{k}</strong><p>{v}</p></div></div>)}</div></section>}
      <div className="sy-hd-end"><div><p className="sy-hd-kicker">MAKE IT YOUR JOURNEY</p><h2>Kỳ nghỉ tiếp theo đang chờ bạn.</h2></div><button className="sy-hd-primary" onClick={()=>jump("sy-hd-rooms")}>Chọn phòng <ArrowUpRight size={18}/></button></div>
    </>}
  </main><Footer/>{lightbox&&<ImageLightbox images={lightbox.images} currentIndex={lightbox.index} onIndexChange={index=>setLightbox(old=>({...old,index}))} onClose={()=>setLightbox(null)}/>}</div>;
}


// Public review feed and authenticated review composer use the existing review APIs.
function HotelGuestReviews({ hotel, onSummary, requestedBookingId }) {
  const { isAuthenticated, sessionChecking } = useAuth();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [checking, setChecking] = useState(false);
  const [choices, setChoices] = useState(null);
  const [selected, setSelected] = useState("");
  const [booking, setBooking] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError("");
    getHotelReviews(hotel._id, { page, limit: 5 }).then(r => {
      if (!active) return;
      if (!r.success || !r.summary || !r.pagination) throw new Error("Invalid review response");
      const last = Math.max(1, Math.ceil(r.pagination.total / 5));
      onSummary({ ...r.summary, hotelId: hotel._id });
      if (page > last) { setPage(last); return; }
      setResult(r);
    }).catch(e => { if (active) setLoadError(e.response?.data?.message || "Không thể tải đánh giá. Vui lòng thử lại."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [hotel._id, page, version, onSummary]);
  const begin = useCallback(async (requestedId = "", isActive = () => true) => {
    setChecking(true); setError(""); setSuccess(""); setChoices(null);
    try {
      const [orders, mine] = await Promise.all([getMyBookings(), getMyReviews()]);
      if (!isActive()) return;
      if (!Array.isArray(orders.data) || !Array.isArray(mine.data)) throw new Error("Invalid review eligibility response");
      const reviewed = new Set(mine.data.map(r => String(r.bookingId?._id || r.bookingId)));
      const eligible = orders.data.filter(b => String(b.hotelId?._id || b.hotelId) === String(hotel._id) && b.status === "COMPLETED" && !reviewed.has(String(b._id)));
      if (requestedId) {
        const target = eligible.find(b => String(b._id) === String(requestedId));
        if (target) setBooking(target);
        else if (reviewed.has(String(requestedId))) setSuccess("Đơn này đã được đánh giá. Bạn có thể xem lại tại Đánh giá của tôi.");
        else setError("Đơn đặt phòng này không đủ điều kiện đánh giá tại khách sạn này.");
      } else if (eligible.length === 1) setBooking(eligible[0]);
      else { setChoices(eligible); setSelected(eligible[0]?._id || ""); }
    } catch(e) { if (isActive()) setError(e.response?.data?.message || "Không thể kiểm tra đơn đặt phòng. Vui lòng thử lại."); }
    finally { if (isActive()) setChecking(false); }
  }, [hotel._id]);
  useEffect(() => {
    if (!requestedBookingId || sessionChecking) return;
    let active = true;
    const frame = requestAnimationFrame(() => {
      document.getElementById("sy-hd-reviews")?.scrollIntoView({block:"start", behavior:"auto"});
      if (isAuthenticated) begin(requestedBookingId, () => active);
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [requestedBookingId, sessionChecking, isAuthenticated, begin]);
  const submit = async values => {
    if (!booking || saving) return;
    if (!values.comment?.trim()) { setError("Vui lòng nhập nội dung nhận xét."); return; }
    setSaving(true); setError("");
    try {
      await createReview({ ...values, bookingId: booking._id });
      setBooking(null); setChoices(null); setSuccess("Đã gửi đánh giá thành công. Bạn có thể quản lý đánh giá tại Đánh giá của tôi.");
      setPage(1); setVersion(v => v + 1);
    } catch(e) { setError(e.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại."); }
    finally { setSaving(false); }
  };
  const items = result?.data || [];
  const summary = result?.summary;
  const pages = Math.max(1, Math.ceil((result?.pagination?.total || 0) / 5));
  const changePage = n => { setPage(n); document.getElementById("sy-hd-reviews")?.scrollIntoView({ block:"start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  return <section id="sy-hd-reviews" className="sy-hd-section sy-hd-guest-reviews">
    <div className="sy-gr-heading"><div><p className="sy-hd-kicker">04 — GUEST STORIES</p><h2>Những trải nghiệm đã được chia sẻ.</h2><p className="sy-hd-description">Chia sẻ cảm nhận sau kỳ nghỉ của bạn.</p></div>
      {isAuthenticated ? <button type="button" className="sy-hd-primary" disabled={checking || saving || !!booking} onClick={()=>begin()}><Star size={18}/>{checking ? "Đang kiểm tra…" : "Viết đánh giá"}</button> : <Link className="sy-hd-primary" to="/login" state={{from: `/hotels/${hotel.slug}`}} aria-disabled={sessionChecking}><Star size={18}/>Đăng nhập để đánh giá</Link>}
    </div>
    <div className="sy-gr-overview"><div className="sy-gr-score"><Star size={23}/><strong>{summary?.count ? `${summary.average}/5` : "—"}</strong><span>{summary ? `${summary.count} đánh giá công khai` : "Đang tải điểm đánh giá"}</span></div><div className="sy-gr-distribution">{[5,4,3,2,1].map(n => <div key={n}><span>{n} ★</span><div className="sy-gr-track"><i style={{width: `${summary?.count ? (summary.distribution?.[n] || 0) / summary.count * 100 : 0}%`}}/></div><span>{summary?.distribution?.[n] || 0}</span></div>)}</div></div>
    {success && <div className="sy-gr-message" role="status"><CheckCircle2 size={19}/><span>{success}</span><Link to="/my-reviews">Đánh giá của tôi ↗</Link></div>}
    {error && !booking && <p className="sy-hd-error" role="alert">{error}</p>}
    {choices && !booking && <div className="sy-gr-choice">{choices.length ? <><strong>Chọn kỳ nghỉ muốn đánh giá</strong><label htmlFor="sy-gr-booking">Đơn đặt phòng đã hoàn thành</label><select id="sy-gr-booking" value={selected} onChange={e=>setSelected(e.target.value)}>{choices.map(b=><option key={b._id} value={b._id}>{b.bookingCode} · {b.roomTypeId?.name || "Phòng"} · {new Date(b.checkOut).toLocaleDateString("vi-VN")}</option>)}</select><button type="button" className="sy-hd-primary" onClick={()=>{setError("");setBooking(choices.find(b=>b._id===selected));}}>Tiếp tục</button></>:<><strong>Chưa có kỳ nghỉ đủ điều kiện đánh giá</strong><p>Bạn cần hoàn thành một đơn đặt phòng tại khách sạn này và chưa đánh giá đơn đó.</p><Link to="/bookings">Xem đặt phòng của tôi ↗</Link><Link to="/my-reviews">Đánh giá của tôi ↗</Link></>}<button type="button" className="sy-gr-secondary" onClick={()=>setChoices(null)}>Đóng</button></div>}
    {loading ? <div className="sy-hd-empty" role="status">Đang tải đánh giá…</div> : loadError ? <div className="sy-hd-empty" role="alert"><p>{loadError}</p><button type="button" className="sy-hd-primary" onClick={()=>setVersion(v=>v+1)}>Thử lại</button></div> : items.length ? <><div className="sy-hd-reviews">{items.map(r=><ReviewCard key={r._id} review={r}/>)}</div>{pages>1&&<nav className="sy-gr-pagination" aria-label="Phân trang đánh giá"><button type="button" disabled={page===1} onClick={()=>changePage(page-1)}>← Trước</button><span>Trang {page}/{pages} · {result.pagination.total} đánh giá</span><button type="button" disabled={page>=pages} onClick={()=>changePage(page+1)}>Sau →</button></nav>}</> : <div className="sy-hd-empty"><MessageSquare size={34}/><h3>Chưa có đánh giá công khai</h3><p>Hãy chia sẻ trải nghiệm sau khi hoàn thành kỳ nghỉ.</p></div>}
    {booking && isAuthenticated && <ReviewForm hotelName={hotel.name} submitting={saving} error={error} onSubmit={submit} onClose={()=>{if(!saving){setBooking(null);setError("");}}}/>}
  </section>;
}
