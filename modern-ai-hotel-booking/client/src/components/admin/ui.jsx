import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Inbox, X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

export const money = (n) => `${new Intl.NumberFormat("vi-VN").format(Math.round(n || 0))}đ`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
export const errMsg = (e) => e?.response?.data?.message || e?.message || "Đã có lỗi xảy ra.";

export const useDebounce = (value, ms = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
};

export const LABELS = {
  ACTIVE: "Hoạt động", INACTIVE: "Ngưng hoạt động", BLOCKED: "Đã khoá",
  CUSTOMER: "Khách hàng", HOTEL_OWNER: "Chủ khách sạn", ADMIN: "Admin",
  DRAFT: "Nháp", PENDING_APPROVAL: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối", SUSPENDED: "Tạm ngưng",
  PENDING: "Chờ xử lý", CONFIRMED: "Đã xác nhận", CHECKED_IN: "Đã nhận phòng", COMPLETED: "Hoàn thành", CANCELLED: "Đã huỷ",
  UNPAID: "Chưa thanh toán", PAID: "Đã thanh toán", REFUNDED: "Đã hoàn tiền",
  EXPIRED: "Hết hạn", SCHEDULED: "Sắp diễn ra", PERCENTAGE: "Giảm theo %", FIXED: "Giảm số tiền",
};
const TONE = {
  ACTIVE: "green", INACTIVE: "slate", BLOCKED: "red", CUSTOMER: "slate", HOTEL_OWNER: "blue", ADMIN: "violet",
  DRAFT: "slate", PENDING_APPROVAL: "amber", APPROVED: "green", REJECTED: "red", SUSPENDED: "slate",
  PENDING: "amber", CONFIRMED: "blue", CHECKED_IN: "violet", COMPLETED: "green", CANCELLED: "red",
  UNPAID: "amber", PAID: "green", REFUNDED: "slate",
  EXPIRED: "red", SCHEDULED: "blue",
};
const TONES = {
  green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-600", amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", slate: "bg-slate-100 text-slate-600",
};
export const STATUS_COLORS = { PENDING: "#f59e0b", CONFIRMED: "#3b82f6", CHECKED_IN: "#8b5cf6", COMPLETED: "#10b981", CANCELLED: "#ef4444" };

export const Badge = ({ value }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[TONE[value] || "slate"]}`}>{LABELS[value] || value}</span>
);

export const StatCard = ({ icon: Icon, label, value, change, unit = "%", badWhenUp = false, loading, accent = "text-blue-600" }) => {
  const up = change > 0;
  const good = change === 0 || change === null ? null : badWhenUp ? !up : up;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <Icon className={accent} size={22} />
        {!loading && change !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${good === null ? "text-slate-400" : good ? "text-emerald-600" : "text-red-500"}`}>
            {change === null ? "Mới" : (<>{up ? <TrendingUp size={14} /> : change < 0 ? <TrendingDown size={14} /> : null}{up ? "+" : ""}{change}{unit === "%" ? "%" : " điểm"}</>)}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      {loading ? <div className="mt-1 h-8 w-28 animate-pulse rounded bg-slate-100" /> : <b className="text-2xl text-slate-900">{value}</b>}
    </div>
  );
};

// Xử lý đủ 3 trạng thái: đang tải, lỗi, rỗng
export const QueryBoundary = ({ query, isEmpty, emptyText = "Không có dữ liệu.", height = "h-48", children }) => {
  if (query.isLoading) return <div className={`${height} animate-pulse rounded-xl bg-slate-100`} />;
  if (query.isError) return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
      <AlertCircle size={18} /> {errMsg(query.error)}
      <button onClick={() => query.refetch()} className="ml-auto font-semibold underline">Thử lại</button>
    </div>
  );
  if (isEmpty) return <div className="flex flex-col items-center gap-2 py-12 text-slate-400"><Inbox size={32} /><p className="text-sm">{emptyText}</p></div>;
  return children;
};

export const Pagination = ({ pagination, onChange }) => {
  if (!pagination) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-slate-500">
      <span>{total} kết quả</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border p-1.5 disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span>Trang {page}/{totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border p-1.5 disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${wide ? "max-w-2xl" : "max-w-md"}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

// Render có điều kiện ở trang cha ({target && <ConfirmModal/>}) để state lý do luôn được reset
export const ConfirmModal = ({ title, description, confirmLabel = "Xác nhận", danger = false, askReason = false, reasonLabel = "Lý do", onConfirm, onClose }) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tooShort = askReason && reason.trim().length < 5;
  const submit = async () => {
    setBusy(true); setError("");
    try { await onConfirm(reason.trim()); onClose(); } catch (e) { setError(errMsg(e)); setBusy(false); }
  };
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      {description && <p className="text-sm text-slate-600">{description}</p>}
      {askReason && (
        <label className="mt-4 block text-sm font-medium text-slate-700">{reasonLabel}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Tối thiểu 5 ký tự" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" />
        </label>
      )}
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={busy} className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-600">Đóng</button>
        <button onClick={submit} disabled={busy || tooShort} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600" : "bg-blue-600"}`}>
          {busy && <Loader2 size={15} className="animate-spin" />}{confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export const Field = ({ label, children }) => (
  <div><p className="text-xs text-slate-400">{label}</p><div className="text-sm font-medium text-slate-800">{children || "—"}</div></div>
);

export const selectCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";
export const inputCls = selectCls;
