import { Minus, Plus } from "lucide-react";

const buttonClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";

// Ô chọn số lượng bằng nút - / + (số phòng, người lớn, trẻ em)
function NumberStepper({ label, hint, value, min, max, onChange }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-700">{label}</p>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Giảm ${label.toLowerCase()}`}
          className={buttonClass}
        >
          <Minus size={16} />
        </button>

        <span className="text-lg font-semibold text-slate-900" aria-live="polite">
          {value}
        </span>

        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`Tăng ${label.toLowerCase()}`}
          className={buttonClass}
        >
          <Plus size={16} />
        </button>
      </div>

      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default NumberStepper;
