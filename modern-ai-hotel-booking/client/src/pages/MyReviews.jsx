import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Camera,
  MessageSquare,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { deleteReview, getMyReviews, updateReview } from "../api/reviewApi";
import ImageLightbox from "../components/ImageLightbox";
import ReviewForm from "../components/ReviewForm";
import StarRating from "../components/StarRating";
import { getImageUrl } from "../utils/imageUrl";

// Trạng thái hiển thị cho đánh giá chưa công khai
const STATUS_BADGES = {
  HIDDEN: { label: "Đang bị ẩn", className: "bg-red-50 text-red-600" },
  PENDING: { label: "Chờ duyệt", className: "bg-amber-50 text-amber-600" },
};

const formatDate = (value) => new Date(value).toLocaleDateString("vi-VN");

function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);
  const dialogRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [lightboxState, setLightboxState] = useState(null);

  useEffect(() => {
    getMyReviews()
      .then((data) => setReviews(data.data || []))
      .catch((err) =>
        setError(
          err.response?.data?.message ||
            "Không tải được đánh giá. Vui lòng thử lại.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const closeForm = () => {
    setEditing(null);
    setFormError("");
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);
      setFormError("");

      const { data } = await updateReview(editing._id, values);

      // Chỉ cập nhật các trường đã sửa để giữ thông tin khách sạn và đơn đặt phòng đã tải
      setReviews((prev) =>
        prev.map((item) =>
          item._id === editing._id
            ? {
                ...item,
                rating: data.rating,
                title: data.title,
                comment: data.comment,
                images: data.images,
                updatedAt: data.updatedAt,
              }
            : item,
        ),
      );
      setEditing(null);
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Không thể lưu thay đổi. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (confirmDelete && !dialogRef.current?.open)
      dialogRef.current?.showModal();
    else if (!confirmDelete && dialogRef.current?.open)
      dialogRef.current.close();
  }, [confirmDelete]);

  const handleDelete = async (id) => {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);
    setError("");

    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((item) => item._id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể xoá đánh giá. Vui lòng thử lại.",
      );
      setConfirmDelete(null);
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  };

  const normalize = (value) =>
    String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const rated = reviews.filter(
    (r) =>
      Number.isFinite(Number(r.rating)) &&
      Number(r.rating) >= 1 &&
      Number(r.rating) <= 5,
  );
  const average = rated.length
    ? (
        rated.reduce((sum, r) => sum + Number(r.rating), 0) / rated.length
      ).toFixed(1)
    : "—";
  const visible = reviews
    .filter(
      (r) =>
        (ratingFilter === "all" || Number(r.rating) === Number(ratingFilter)) &&
        normalize(
          [r.hotelId?.name, r.hotelId?.address?.city, r.title, r.comment].join(
            " ",
          ),
        ).includes(normalize(query.trim())),
    )
    .sort((a, b) =>
      sort === "rating"
        ? Number(b.rating) - Number(a.rating)
        : sort === "old"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt),
    );
  const reset = () => {
    setQuery("");
    setRatingFilter("all");
    setSort("recent");
  };

  return (
    <div className="sy-reviews">
      <header className="sy-reviews-heading">
        <div>
          <p className="sy-reviews-kicker">YOUR TRAVEL STORIES</p>
          <h1>Đánh giá của tôi</h1>
          <p>Lưu lại cảm nhận và chia sẻ những trải nghiệm sau mỗi kỳ nghỉ.</p>
        </div>
        <Link className="sy-reviews-secondary" to="/bookings">
          Đặt phòng của tôi <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="sy-reviews-summary" aria-label="Tổng quan đánh giá">
        <div className="sy-reviews-summary-intro">
          <span className="sy-reviews-emblem">
            <Star size={27} />
          </span>
          <div>
            <p className="sy-reviews-kicker">THE EXPERIENCE COLLECTION</p>
            <h2>Mỗi kỳ nghỉ, một câu chuyện.</h2>
            <p>Những trải nghiệm của riêng bạn.</p>
          </div>
        </div>
        <div className="sy-reviews-stats">
          <div>
            <MessageSquare size={17} />
            <strong>{loading ? "—" : reviews.length}</strong>
            <span>Đánh giá đã viết</span>
          </div>
          <div>
            <Star size={17} />
            <strong>
              {loading ? "—" : average}
              {!loading && rated.length > 0 && <small> / 5</small>}
            </strong>
            <span>Điểm trung bình</span>
          </div>
          <div>
            <Camera size={17} />
            <strong>
              {loading ? "—" : reviews.filter((r) => r.images?.length).length}
            </strong>
            <span>Đánh giá có ảnh</span>
          </div>
        </div>
      </section>
      {error && (
        <div role="alert" className="sy-reviews-error">
          {error}
        </div>
      )}
      {loading ? (
        <div
          role="status"
          aria-label="Đang tải đánh giá"
          className="sy-reviews-list"
        >
          {[1, 2].map((i) => (
            <div key={i} className="sy-reviews-skeleton" />
          ))}
        </div>
      ) : (
        <>
          {reviews.length > 0 && (
            <>
              <div className="sy-reviews-toolbar">
                <div className="sy-reviews-search">
                  <Search size={18} />
                  <input
                    aria-label="Tìm đánh giá"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm khách sạn, nội dung..."
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Xóa từ khóa"
                      onClick={() => setQuery("")}
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
                <label>
                  Điểm sao
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} sao
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Sắp xếp
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="recent">Mới nhất</option>
                    <option value="old">Cũ nhất</option>
                    <option value="rating">Điểm cao nhất</option>
                  </select>
                </label>
              </div>
              <p className="sy-reviews-count">
                {visible.length}/{reviews.length} đánh giá
              </p>
            </>
          )}
          <div className="sy-reviews-list">
            {visible.map((review) => {
              const hotel = review.hotelId;
              const badge = STATUS_BADGES[review.status];
              return (
                <article key={review._id} className="sy-reviews-card">
                  <div className="sy-reviews-card-top">
                    <div className="sy-reviews-photo">
                      <Building2 size={26} />
                      {hotel?.images?.[0]?.url && (
                        <img
                          src={getImageUrl(hotel.images[0].url)}
                          alt={hotel.name || "Khách sạn"}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.hidden = true;
                          }}
                        />
                      )}
                    </div>
                    <div className="sy-reviews-hotel">
                      {hotel?.slug ? (
                        <Link to={`/hotels/${hotel.slug}`}>
                          {hotel.name} <ArrowUpRight size={15} />
                        </Link>
                      ) : (
                        <strong>
                          {hotel?.name || "Khách sạn không còn tồn tại"}
                        </strong>
                      )}
                      {hotel?.address?.city && <p>{hotel.address.city}</p>}
                      <div className="sy-reviews-meta">
                        <CalendarDays size={14} />
                        {review.createdAt && formatDate(review.createdAt)}
                        {badge && (
                          <span
                            className={`sy-reviews-status ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        )}
                        {review.status === "PUBLISHED" && (
                          <span className="sy-reviews-status sy-reviews-published">
                            Đã công khai
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="sy-reviews-score">
                      <strong>
                        {review.rating}
                        <small>/5</small>
                      </strong>
                      <StarRating value={review.rating} />
                    </div>
                  </div>
                  <div className="sy-reviews-content">
                    {review.title && <h2>{review.title}</h2>}
                    {review.comment && <p>{review.comment}</p>}
                    {review.images?.length > 0 && (
                      <div className="sy-reviews-gallery">
                        <h3>
                          <Camera size={16} /> Hình ảnh đính kèm (
                          {review.images.length})
                        </h3>
                        <div>
                          {review.images.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              aria-label={`Xem ảnh ${idx + 1}`}
                              onClick={() =>
                                setLightboxState({
                                  images: review.images,
                                  index: idx,
                                })
                              }
                            >
                              <img
                                src={getImageUrl(img)}
                                alt={`Ảnh đánh giá ${idx + 1}`}
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {review.hotelResponse?.content && (
                      <aside className="sy-reviews-response">
                        <h3>
                          <MessageSquare size={16} /> Phản hồi từ khách sạn
                        </h3>
                        <p>{review.hotelResponse.content}</p>
                      </aside>
                    )}
                  </div>
                  <footer className="sy-reviews-actions">
                    <button
                      type="button"
                      className="sy-reviews-secondary"
                      onClick={() => setEditing(review)}
                    >
                      <Pencil size={16} /> Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="sy-reviews-danger"
                      onClick={() => setConfirmDelete(review)}
                    >
                      <Trash2 size={16} /> Xóa đánh giá
                    </button>
                  </footer>
                </article>
              );
            })}
            {!reviews.length && !error && (
              <section className="sy-reviews-empty">
                <span className="sy-reviews-empty-icon">
                  <Star size={36} />
                </span>
                <p className="sy-reviews-kicker">YOUR STORY STARTS HERE</p>
                <h2>Những trải nghiệm đáng để kể.</h2>
                <p>
                  Bạn chưa có đánh giá nào. Sau kỳ nghỉ, hãy vào đơn đặt phòng
                  đủ điều kiện để chia sẻ cảm nhận của bạn.
                </p>
                <Link className="sy-reviews-primary" to="/bookings">
                  Xem đặt phòng của tôi <ArrowUpRight size={17} />
                </Link>
              </section>
            )}
            {reviews.length > 0 && !visible.length && (
              <section className="sy-reviews-empty">
                <Search size={32} />
                <h2>Không tìm thấy đánh giá phù hợp</h2>
                <p>Thử từ khóa hoặc mức sao khác.</p>
                <button className="sy-reviews-secondary" onClick={reset}>
                  Xóa bộ lọc
                </button>
              </section>
            )}
          </div>
        </>
      )}
      <dialog
        ref={dialogRef}
        className="sy-reviews-dialog"
        onCancel={(e) => {
          e.preventDefault();
          if (!deleting) setConfirmDelete(null);
        }}
        aria-labelledby="sy-review-delete-title"
      >
        <span className="sy-reviews-delete-icon">
          <Trash2 size={25} />
        </span>
        <h2 id="sy-review-delete-title">Xóa đánh giá này?</h2>
        <p>
          Đánh giá tại {confirmDelete?.hotelId?.name || "khách sạn này"} sẽ bị
          xóa. Bạn có chắc muốn tiếp tục?
        </p>
        <div className="sy-reviews-actions">
          <button
            autoFocus
            type="button"
            className="sy-reviews-secondary"
            disabled={deleting}
            onClick={() => setConfirmDelete(null)}
          >
            Giữ đánh giá
          </button>
          <button
            type="button"
            className="sy-reviews-danger-solid"
            disabled={deleting || !confirmDelete}
            onClick={() => handleDelete(confirmDelete._id)}
          >
            {deleting ? "Đang xóa..." : "Xác nhận xóa"}
          </button>
        </div>
      </dialog>

      {editing && (
        <ReviewForm
          hotelName={editing.hotelId?.name}
          initial={editing}
          submitting={saving}
          error={formError}
          onSubmit={handleSave}
          onClose={closeForm}
        />
      )}

      {lightboxState && (
        <ImageLightbox
          images={lightboxState.images}
          currentIndex={lightboxState.index}
          onIndexChange={(idx) =>
            setLightboxState((prev) => ({ ...prev, index: idx }))
          }
          onClose={() => setLightboxState(null)}
        />
      )}
    </div>
  );
}

export default MyReviews;
