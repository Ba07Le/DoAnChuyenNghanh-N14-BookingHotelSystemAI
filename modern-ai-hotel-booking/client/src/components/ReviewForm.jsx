import { ImagePlus, Link as LinkIcon, Loader2, Star, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getImageUrl } from "../utils/imageUrl";

const RATING_LABELS = ["Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"];
const TITLE_MAX = 100;
const COMMENT_MAX = 2000;
const MAX_IMAGES = 5;

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

// Nén ảnh trên client bằng Canvas để tải lên mượt mà và không tốn dung lượng
const compressImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Không thể xử lý ảnh này."));
    };
    reader.onerror = () => reject(new Error("Không thể đọc tệp tin."));
  });

/**
 * Khung viết / sửa đánh giá:
 * - Chọn sao 1 - 5
 * - Viết tiêu đề & nhận xét
 * - Thêm ảnh (chọn file từ máy hoặc dán link URL, tối đa 5 ảnh)
 */
function ReviewForm({ hotelName, initial, submitting, error, onSubmit, onClose }) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [images, setImages] = useState(initial?.images || []);
  const [processingImages, setProcessingImages] = useState(false);
  const [localError, setLocalError] = useState("");

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  const fileInputRef = useRef(null);
  const isEditing = Boolean(initial);
  const shownRating = hovered || rating;

  // Nhấn Esc để đóng (trừ lúc đang gửi)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting && !processingImages) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting, processingImages]);

  // Xử lý khi chọn file từ máy
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > MAX_IMAGES) {
      setLocalError(`Bạn chỉ có thể chọn tối đa ${MAX_IMAGES} ảnh.`);
      e.target.value = "";
      return;
    }

    try {
      setProcessingImages(true);
      setLocalError("");

      const compressedList = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setLocalError("Vui lòng chỉ chọn các tệp hình ảnh (JPG, PNG, WebP).");
          continue;
        }
        const dataUrl = await compressImageFile(file);
        compressedList.push(dataUrl);
      }

      setImages((prev) => [...prev, ...compressedList].slice(0, MAX_IMAGES));
    } catch {
      setLocalError("Lỗi khi xử lý hình ảnh. Vui lòng thử lại.");
    } finally {
      setProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Thêm ảnh từ URL
  const handleAddUrl = (e) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    if (!/^https?:\/\/\S+$/i.test(trimmed)) {
      setLocalError("Đường dẫn URL ảnh không hợp lệ (cần bắt đầu bằng http:// hoặc https://).");
      return;
    }

    if (images.length >= MAX_IMAGES) {
      setLocalError(`Đã đạt giới hạn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    setImages((prev) => [...prev, trimmed]);
    setCustomUrl("");
    setLocalError("");
    setShowUrlInput(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setLocalError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!rating) {
      setLocalError("Vui lòng chọn số sao để đánh giá.");
      return;
    }

    setLocalError("");
    onSubmit({
      rating,
      title: title.trim(),
      comment: comment.trim(),
      images,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting && !processingImages) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Sửa đánh giá" : "Viết đánh giá"}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isEditing ? "Chỉnh sửa đánh giá" : "Đánh giá kỳ nghỉ"}
            </h2>
            <p className="mt-1 text-sm font-medium text-blue-600">{hotelName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting || processingImages}
            aria-label="Đóng"
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Chọn sao */}
          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Bạn đánh giá chất lượng kỳ nghỉ thế nào? <span className="text-red-500">*</span>
            </label>

            <div
              role="radiogroup"
              aria-label="Số sao"
              className="mt-2.5 flex items-center gap-2"
              onMouseLeave={() => setHovered(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} sao`}
                  onClick={() => {
                    setRating(star);
                    setLocalError("");
                  }}
                  onMouseEnter={() => setHovered(star)}
                  className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={36}
                    className={
                      star <= shownRating
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "text-slate-200 hover:text-amber-200"
                    }
                  />
                </button>
              ))}

              <span className="ml-2 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                {shownRating ? `${shownRating}/5 sao` : "Chưa chọn"}
              </span>
            </div>

            <p className="mt-1.5 text-xs font-medium text-slate-500">
              {shownRating ? RATING_LABELS[shownRating - 1] : "Nhấp vào sao để chọn mức độ hài lòng"}
            </p>
          </div>

          {/* Tiêu đề đánh giá */}
          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Tiêu đề nhận xét <span className="font-normal text-slate-400">(không bắt buộc)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder="VD: Kỳ nghỉ tuyệt vời, phòng ốc sạch sẽ, nhân viên thân thiện..."
              className={inputClass}
            />
          </div>

          {/* Nội dung nhận xét */}
          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Nội dung đánh giá chi tiết
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={COMMENT_MAX}
              rows={4}
              placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn về không gian, dịch vụ, tiện nghi để giúp các khách du lịch khác..."
              className={`${inputClass} resize-none`}
            />
            <span className="mt-1 block text-right text-xs text-slate-400">
              {comment.length}/{COMMENT_MAX} ký tự
            </span>
          </div>

          {/* PHẦN THÊM HÌNH ẢNH */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-800">
                Hình ảnh thực tế <span className="font-normal text-slate-400">(tối đa 5 ảnh)</span>
              </label>
              <span className="text-xs font-medium text-slate-500">
                Đã chọn {images.length}/{MAX_IMAGES}
              </span>
            </div>

            {/* Danh sách ảnh đã chọn */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs"
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Ảnh đã chọn ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      aria-label="Xoá ảnh"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-90 shadow-sm transition hover:scale-110 hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Các nút thêm ảnh */}
            {images.length < MAX_IMAGES && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={processingImages || submitting}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/60 disabled:opacity-50"
                >
                  {processingImages ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xử lý ảnh...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Tải ảnh từ máy
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <LinkIcon size={14} />
                  {showUrlInput ? "Ẩn nhập link" : "Thêm bằng link ảnh"}
                </button>
              </div>
            )}

            {/* Ô dán link ảnh */}
            {showUrlInput && images.length < MAX_IMAGES && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/hinh-anh.jpg"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                >
                  Thêm link
                </button>
              </div>
            )}
          </div>

          {/* Lỗi */}
          {(localError || error) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
              {localError || error}
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || processingImages}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Huỷ
            </button>

            <button
              type="submit"
              disabled={submitting || processingImages}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang gửi...
                </>
              ) : isEditing ? (
                "Lưu thay đổi"
              ) : (
                "Gửi đánh giá"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewForm;
