import { Camera, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [lightboxState, setLightboxState] = useState(null);

  useEffect(() => {
    getMyReviews()
      .then((data) => setReviews(data.data || []))
      .catch((err) => setError(err.response?.data?.message || "Không tải được đánh giá. Vui lòng thử lại."))
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
      setFormError(err.response?.data?.message || "Không thể lưu thay đổi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá đánh giá này?")) return;

    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xoá đánh giá. Vui lòng thử lại.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Đánh giá của tôi</h1>
      <p className="mt-2 text-slate-500">Những đánh giá bạn đã viết sau các kỳ nghỉ.</p>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reviews.map((review) => {
            const hotel = review.hotelId;
            const badge = STATUS_BADGES[review.status];

            return (
              <article
                key={review._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {hotel?.images?.[0]?.url && (
                    <img
                      src={hotel.images[0].url}
                      alt={hotel.name}
                      className="h-28 w-full rounded-xl object-cover sm:w-40"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        {hotel ? (
                          <Link
                            to={`/hotels/${hotel.slug}`}
                            className="text-lg font-bold text-slate-900 hover:text-blue-600"
                          >
                            {hotel.name}
                          </Link>
                        ) : (
                          <p className="text-lg font-bold text-slate-900">Khách sạn không còn tồn tại</p>
                        )}

                        {hotel?.address?.city && (
                          <p className="text-sm text-slate-500">{hotel.address.city}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => setEditing(review)}
                          aria-label="Sửa đánh giá"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(review._id)}
                          aria-label="Xoá đánh giá"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <StarRating value={review.rating} />

                      <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>

                      {badge && (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    {review.title && <p className="mt-3 font-semibold text-slate-900">{review.title}</p>}

                    {review.comment && (
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {review.comment}
                      </p>
                    )}

                    {review.images && review.images.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold text-slate-500">
                          Hình ảnh đính kèm ({review.images.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {review.images.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLightboxState({ images: review.images, index: idx })}
                              className="group relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-blue-500 hover:shadow-xs"
                            >
                              <img
                                src={getImageUrl(img)}
                                alt=""
                                className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {review.hotelResponse?.content && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                        <p className="font-semibold text-slate-700">Phản hồi từ khách sạn</p>
                        <p className="mt-1 whitespace-pre-line leading-6 text-slate-600">
                          {review.hotelResponse.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {!reviews.length && !error && (
            <div className="rounded-2xl bg-white p-12 text-center">
              <p className="text-slate-500">Bạn chưa có đánh giá nào.</p>
              <Link to="/bookings" className="mt-4 inline-block text-blue-600">
                Xem đặt phòng của tôi
              </Link>
            </div>
          )}
        </div>
      )}

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
          onIndexChange={(idx) => setLightboxState((prev) => ({ ...prev, index: idx }))}
          onClose={() => setLightboxState(null)}
        />
      )}
    </div>
  );
}

export default MyReviews;
