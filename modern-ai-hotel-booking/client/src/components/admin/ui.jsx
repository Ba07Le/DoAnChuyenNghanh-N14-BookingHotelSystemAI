/* eslint-disable react-refresh/only-export-components */
// Bộ UI dùng chung cho trang Admin.
// File gốc trong bản dump bị đánh dấu "Binary file" nên được viết lại theo đúng props mà các trang admin đang truyền vào:
// Badge, StatCard, QueryBoundary, Pagination, Modal, ConfirmModal, Field + các helper (money, fmtDate, fmtDateTime, errMsg, useDebounce).
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

// ---------- class dùng chung cho input / select ----------
export const inputCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
export const selectCls = `${inputCls} pr-8`;

// ---------- nhãn tiếng Việt + màu ----------
export const LABELS = {
  // vai trò
  CUSTOMER: "Khách hàng", HOTEL_OWNER: "Chủ khách sạn", ADMIN: "Quản trị viên",
  // trạng thái tài khoản
  ACTIVE: "Hoạt động", INACTIVE: "Ngưng hoạt động", BLOCKED: "Đã khoá",
  // trạng thái khách sạn
  DRAFT: "Nháp", PENDING_APPROVAL: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối", SUSPENDED: "Tạm ngưng",
  // trạng thái đặt phòng
  PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", CHECKED_IN: "Đã nhận phòng", COMPLETED: "Hoàn thành", CANCELLED: "Đã huỷ",
  // thanh toán
  UNPAID: "Chưa thanh toán", PAID: "Đã thanh toán", REFUNDED: "Đã hoàn tiền",
  // mã giảm giá
  EXPIRED: "Hết hạn", SCHEDULED: "Sắp diễn ra",
};

const BADGE_COLORS = {
  ACTIVE: "bg-emerald-50 text-emerald-700", APPROVED: "bg-emerald-50 text-emerald-700", PAID: "bg-emerald-50 text-emerald-700", COMPLETED: "bg-emerald-50 text-emerald-700", CONFIRMED: "bg-blue-50 text-blue-700",
  CHECKED_IN: "bg-indigo-50 text-indigo-700", SCHEDULED: "bg-sky-50 text-sky-700", ADMIN: "bg-violet-50 text-violet-700", HOTEL_OWNER: "bg-sky-50 text-sky-700", CUSTOMER: "bg-slate-100 text-slate-700",
  PENDING: "bg-amber-50 text-amber-700", PENDING_APPROVAL: "bg-amber-50 text-amber-700", UNPAID: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-700", BLOCKED: "bg-red-50 text-red-700", CANCELLED: "bg-red-50 text-red-700",
  SUSPENDED: "bg-orange-50 text-orange-700", REFUNDED: "bg-orange-50 text-orange-700",
  INACTIVE: "bg-slate-100 text-slate-600", EXPIRED: "bg-slate-100 text-slate-600", DRAFT: "bg-slate-100 text-slate-600",
};

// màu cho biểu đồ tròn "đặt phòng theo trạng thái"
export const STATUS_COLORS = {
  PENDING: "#f59e0b", CONFIRMED: "#2563eb", CHECKED_IN: "#6366f1", COMPLETED: "#10b981", CANCELLED: "#ef4444",
};

// ---------- helper ----------
export const money = (n) => `${new Intl.NumberFormat("vi-VN").format(Math.round(Number(n) || 0))}đ`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—");
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—");
export const errMsg = (err) => err?.response?.data?.message || err?.message || "Có lỗi xảy ra. Vui lòng thử lại.";

export function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// ---------- component ----------
export function Badge({ value }) {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_COLORS[value] || "bg-slate-100 text-slate-600"}`}>
      {LABELS[value] || value}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children ?? "—"}</dd>
    </div>
  );
}

// change: % thay đổi so với kỳ trước (null = kỳ trước bằng 0). unit="pt" cho tỷ lệ huỷ (chênh lệch điểm %).
// badWhenUp: tăng là xấu (vd tỷ lệ huỷ) nên đảo màu.
export function StatCard({ loading, icon: Icon, label, value, change, unit = "%", badWhenUp = false, accent = "text-blue-600" }) {
  const hasChange = change !== undefined;
  const up = (change ?? 0) > 0;
  const good = change === 0 || change === null ? null : badWhenUp ? !up : up;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && <Icon size={18} className={accent} />}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? "—"}</p>
      )}
      {!loading && hasChange && (
        <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${good === null ? "text-slate-400" : good ? "text-emerald-600" : "text-red-500"}`}>
          {change === null ? "Mới (kỳ trước = 0)" : (
            <>
              {change !== 0 && (up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
              {change > 0 ? "+" : ""}{change}{unit === "pt" ? " điểm %" : "%"} so với kỳ trước
            </>
          )}
        </p>
      )}
    </div>
  );
}

// Bọc kết quả useQuery: loading / lỗi (có nút thử lại) / rỗng / nội dung.
export function QueryBoundary({ query, isEmpty = false, emptyText = "Không có dữ liệu.", height = "h-40", children }) {
  if (query.isLoading) {
    return <div className={`flex ${height} items-center justify-center text-slate-400`}><Loader2 className="animate-spin" size={22} /></div>;
  }
  if (query.isError) {
    return (
      <div className={`flex ${height} flex-col items-center justify-center gap-2 text-sm text-red-600`}>
        <p>{errMsg(query.error)}</p>
        <button type="button" onClick={() => query.refetch()} className="rounded-lg border border-red-200 px-3 py-1 font-semibold hover:bg-red-50">Thử lại</button>
      </div>
    );
  }
  if (isEmpty) return <div className={`flex ${height} items-center justify-center text-sm text-slate-400`}>{emptyText}</div>;
  return children ?? null;
}

export function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>Trang {page}/{totalPages} · {total} bản ghi</span>
      <div className="flex gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40" aria-label="Trang trước"><ChevronLeft size={16} /></button>
        <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40" aria-label="Trang sau"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, wide = false, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Đóng"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// onConfirm(reason) có thể trả về Promise (mutateAsync): thành công -> đóng modal, lỗi -> hiện thông báo ngay trong modal.
export function ConfirmModal({ title, description, confirmLabel = "Xác nhận", danger = false, askReason = false, reasonLabel = "Lý do", onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tooShort = askReason && reason.trim().length < 5;

  const run = async () => {
    setBusy(true); setError("");
    try {
      await onConfirm(askReason ? reason.trim() : undefined);
      onClose();
    } catch (err) {
      setError(errMsg(err)); setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      {description && <p className="text-sm text-slate-600">{description}</p>}
      {askReason && (
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          {reasonLabel}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder="Tối thiểu 5 ký tự" className={`${inputCls} mt-1 w-full font-normal`} />
        </label>
      )}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">Huỷ</button>
        <button type="button" onClick={run} disabled={busy || tooShort} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
          {busy && <Loader2 size={14} className="animate-spin" />}{confirmLabel}
        </button>
      </div>
    </Modal>
  );
}