import { CheckCircle2, MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import ImageLightbox from "./ImageLightbox";
import StarRating from "./StarRating";
import { getImageUrl } from "../utils/imageUrl";

const RATING_TEXTS = {
  5: "Tuyệt vời",
  4: "Rất tốt",
  3: "Hài lòng",
  2: "Tạm được",
  1: "Chưa hài lòng",
};

export default function ReviewCard({ review }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!review) return null;

  const reviewer = review.userId;
  const fullName = reviewer?.fullName?.trim() || "Khách hàng";
  const avatar = reviewer?.avatar;

  // Tên viết tắt hiển thị avatar nếu chưa có ảnh
  const initials = fullName
    .split(/\s+/)
    .slice(-2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "KH";

  // Định dạng ngày
  const dateStr = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const images = Array.isArray(review.images) ? review.images.filter(Boolean) : [];

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-200 hover:shadow-md">
      <div>
        {/* Header: Thông tin người đánh giá & Số sao / Thời gian */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img
                src={getImageUrl(avatar)}
                alt={fullName}
                className="h-12 w-12 rounded-full border border-slate-200 object-cover shadow-xs"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-xs">
                {initials}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900">{fullName}</h4>
              </div>
              {dateStr && (
                <p className="mt-0.5 text-xs text-slate-400">
                  Đánh giá vào {dateStr}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <StarRating value={review.rating} size={17} />       
            </div>
            <span className="mt-0.5 text-xs font-medium text-slate-500">
              {RATING_TEXTS[review.rating] || "Đã trải nghiệm"}
            </span>
          </div>
        </div>

        {/* Nội dung đánh giá */}
        <div className="pt-4">
          {review.title && (
            <h5 className="text-base font-bold text-slate-900">
              {review.title}
            </h5>
          )}

          {review.comment ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
              {review.comment}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">
              Không có nhận xét chi tiết.
            </p>
          )}

          {/* Danh sách hình ảnh thực tế đính kèm */}
          {images.length > 0 && (
            <div className="mt-4">
            
              <div className="flex flex-wrap gap-2.5">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-all hover:border-blue-500 hover:shadow-md"
                  >
                    <img
                      src={getImageUrl(imgUrl)}
                      alt={`Ảnh đánh giá ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Phản hồi từ phía khách sạn (nếu có) */}
      {review.hotelResponse?.content && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
            <MessageSquare size={14} />
            <span>Phản hồi từ Ban quản lý khách sạn</span>
            {review.hotelResponse.respondedAt && (
              <span className="font-normal text-slate-400">
                · {new Date(review.hotelResponse.respondedAt).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
            {review.hotelResponse.content}
          </p>
        </div>
      )}

      {/* Lightbox phóng to ảnh */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  );
}
