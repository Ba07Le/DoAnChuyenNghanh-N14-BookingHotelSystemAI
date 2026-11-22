import { Star } from "lucide-react";

// Hiển thị số sao (chỉ xem, không bấm được)
function StarRating({ value, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}
        />
      ))}
    </div>
  );
}

export default StarRating;
