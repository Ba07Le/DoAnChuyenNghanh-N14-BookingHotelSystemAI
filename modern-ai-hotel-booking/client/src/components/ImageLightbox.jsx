import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import { getImageUrl } from "../utils/imageUrl";

export default function ImageLightbox({ images = [], initialIndex = 0, onClose, onIndexChange, currentIndex }) {
  const activeIndex = currentIndex ?? initialIndex;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && activeIndex > 0) {
        onIndexChange?.(activeIndex - 1);
      }
      if (e.key === "ArrowRight" && activeIndex < images.length - 1) {
        onIndexChange?.(activeIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length, onClose, onIndexChange]);

  if (!images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
      >
        <X size={22} />
      </button>

      {images.length > 1 && activeIndex > 0 && (
        <button
          onClick={() => onIndexChange?.(activeIndex - 1)}
          aria-label="Ảnh trước"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {images.length > 1 && activeIndex < images.length - 1 && (
        <button
          onClick={() => onIndexChange?.(activeIndex + 1)}
          aria-label="Ảnh kế tiếp"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40"
        >
          <ChevronRight size={24} />
        </button>
      )}

      <div className="flex max-h-[85vh] max-w-4xl flex-col items-center">
        <img
          src={getImageUrl(images[activeIndex])}
          alt={`Review image ${activeIndex + 1}`}
          className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
        />

        {images.length > 1 && (
          <div className="mt-4 flex items-center gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => onIndexChange?.(i)}
                className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition ${
                  i === activeIndex ? "border-white scale-105" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 text-xs font-medium text-white/70">
          Ảnh {activeIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
