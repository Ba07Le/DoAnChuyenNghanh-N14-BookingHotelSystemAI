import { useState } from "react";
import { Plus, Search, Pencil, Power, Trash2, Loader2, Star } from "lucide-react";
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon, useSetCouponStatus, useDeleteCoupon } from "../../hooks/useAdmin";
import { Badge, QueryBoundary, Pagination, ConfirmModal, Modal, useDebounce, fmtDate, money, errMsg, inputCls } from "../../components/admin/ui";

const TABS = [{ key: "", label: "Tất cả" }, { key: "ACTIVE", label: "Đang hoạt động" }, { key: "INACTIVE", label: "Đã tắt" }, { key: "EXPIRED", label: "Hết hạn" }];

// Date -> "YYYY-MM-DD" theo giờ Việt Nam (khớp với cách backend lưu ngày)
const toInputDate = (d) => (d ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(d)) : "");
const today = () => toInputDate(new Date());

const discountText = (c) =>
  c.discountType === "PERCENTAGE" ? `${c.discountValue}%${c.maxDiscount ? ` (tối đa ${money(c.maxDiscount)})` : ""}` : money(c.discountValue);

const EMPTY = { code: "", title: "", description: "", discountType: "PERCENTAGE", discountValue: "", minBookingAmount: 0, maxDiscount: 0, usageLimit: 0, startDate: today(), endDate: "", featured: false, status: "ACTIVE" };

function Labeled({ label, hint, children, className = "" }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>{label}
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs font-normal text-slate-400">{hint}</span>}
    </label>
  );
}

function CouponForm({ coupon, onClose }) {
  const editing = !!coupon;
  const create = useCreateCoupon(), update = useUpdateCoupon();
  const [f, setF] = useState(() => editing
    ? { ...EMPTY, ...coupon, startDate: toInputDate(coupon.startDate), endDate: toInputDate(coupon.endDate), status: coupon.status === "INACTIVE" ? "INACTIVE" : "ACTIVE" }
    : EMPTY);
  const [error, setError] = useState("");
  const set = (patch) => setF((s) => ({ ...s, ...patch }));
  const busy = create.isPending || update.isPending;
  const pct = f.discountType === "PERCENTAGE";

  const submit = async (e) => {
    e.preventDefault(); setError("");
    const body = {
      title: f.title, description: f.description, discountType: f.discountType, discountValue: Number(f.discountValue),
      minBookingAmount: Number(f.minBookingAmount) || 0, maxDiscount: pct ? Number(f.maxDiscount) || 0 : 0, usageLimit: Number(f.usageLimit) || 0,
      startDate: f.startDate, endDate: f.endDate, featured: f.featured, status: f.status,
    };
    try {
      if (editing) await update.mutateAsync({ id: coupon._id, ...body });
      else await create.mutateAsync({ code: f.code, ...body });
      onClose();
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <Modal title={editing ? `Sửa mã ${coupon.code}` : "Tạo mã giảm giá"} onClose={busy ? () => {} : onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Mã" hint={editing ? "Không thể đổi mã đã phát hành." : "3–20 ký tự: chữ, số, - hoặc _. Tự viết hoa."}>
            <input value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} disabled={editing} required maxLength={20} placeholder="SUMMER10" className={`${inputCls} w-full font-mono disabled:bg-slate-50`} />
          </Labeled>
          <Labeled label="Tiêu đề hiển thị">
            <input value={f.title} onChange={(e) => set({ title: e.target.value })} required minLength={3} maxLength={120} placeholder="Ưu đãi mùa hè" className={`${inputCls} w-full`} />
          </Labeled>
        </div>
        <Labeled label="Mô tả"><textarea value={f.description} onChange={(e) => set({ description: e.target.value })} rows={2} maxLength={500} className={`${inputCls} w-full`} /></Labeled>

        <div className="grid gap-4 sm:grid-cols-3">
          <Labeled label="Loại giảm">
            <select value={f.discountType} onChange={(e) => set({ discountType: e.target.value })} className={`${inputCls} w-full`}>
              <option value="PERCENTAGE">Theo phần trăm (%)</option><option value="FIXED">Số tiền cố định (đ)</option>
            </select>
          </Labeled>
          <Labeled label={pct ? "Giảm (%)" : "Giảm (đ)"}>
            <input type="number" value={f.discountValue} onChange={(e) => set({ discountValue: e.target.value })} required min={1} max={pct ? 100 : undefined} className={`${inputCls} w-full`} />
          </Labeled>
          <Labeled label="Giảm tối đa (đ)" hint={pct ? "0 = không giới hạn" : "Chỉ áp dụng với giảm %"}>
            <input type="number" value={pct ? f.maxDiscount : 0} onChange={(e) => set({ maxDiscount: e.target.value })} min={0} disabled={!pct} className={`${inputCls} w-full disabled:bg-slate-50`} />
          </Labeled>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Đơn tối thiểu (đ)" hint="0 = áp dụng mọi đơn"><input type="number" value={f.minBookingAmount} onChange={(e) => set({ minBookingAmount: e.target.value })} min={0} className={`${inputCls} w-full`} /></Labeled>
          <Labeled label="Giới hạn lượt dùng" hint={editing ? `Đã dùng ${coupon.usedCount}. 0 = không giới hạn` : "0 = không giới hạn"}><input type="number" value={f.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} min={coupon?.usedCount || 0} className={`${inputCls} w-full`} /></Labeled>
          <Labeled label="Bắt đầu"><input type="date" value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} required max={f.endDate || undefined} className={`${inputCls} w-full`} /></Labeled>
          <Labeled label="Kết thúc"><input type="date" value={f.endDate} onChange={(e) => set({ endDate: e.target.value })} required min={f.startDate || undefined} className={`${inputCls} w-full`} /></Labeled>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-slate-700">
          <label className="flex items-center gap-2"><input className="accent-[#087e83]" type="checkbox" checked={f.status === "ACTIVE"} onChange={(e) => set({ status: e.target.checked ? "ACTIVE" : "INACTIVE" })} />Kích hoạt</label>
          <label className="flex items-center gap-2"><input className="accent-[#087e83]" type="checkbox" checked={f.featured} onChange={(e) => set({ featured: e.target.checked })} />Nổi bật trên trang chủ</label>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-600">Đóng</button>
          <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#087e83] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy && <Loader2 size={15} className="animate-spin" />}{editing ? "Lưu thay đổi" : "Tạo mã"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const Usage = ({ c }) => {
  if (!c.usageLimit) return <span>{c.usedCount} lượt</span>;
  const p = Math.min(100, Math.round((c.usedCount / c.usageLimit) * 100));
  return (
    <div className="w-28">
      <p className="text-xs text-slate-500">{c.usedCount}/{c.usageLimit} lượt</p>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${p >= 100 ? "bg-red-500" : "bg-[#118e91]"}`} style={{ width: `${p}%` }} /></div>
    </div>
  );
};

export default function AdminCoupons() {
  const [f, setF] = useState({ search: "", state: "", page: 1 });
  const search = useDebounce(f.search);
  const query = useAdminCoupons({ search, state: f.state, page: f.page, limit: 10 });
  const toggle = useSetCouponStatus(), remove = useDeleteCoupon();
  const [form, setForm] = useState(null); // { coupon? }
  const [action, setAction] = useState(null); // { type: "toggle" | "delete", coupon }
  const set = (patch) => setF((s) => ({ ...s, ...patch, page: patch.page ?? 1 }));
  const counts = query.data?.stateCounts || {};
  const total = (counts.ACTIVE ?? 0) + (counts.INACTIVE ?? 0) + (counts.EXPIRED ?? 0);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Mã giảm giá</h1>
          <p className="text-sm text-slate-500">Mã đã có người dùng chỉ được tắt, không xoá, để lịch sử đặt phòng luôn đối chiếu được.</p></div>
        <button onClick={() => setForm({})} className="inline-flex items-center gap-2 rounded-xl bg-[#087e83] px-4 py-2 text-sm font-semibold text-white"><Plus size={16} />Tạo mã</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap rounded-xl bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => set({ state: t.key })} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${f.state === t.key ? "bg-[#087e83] text-white" : "text-slate-600"}`}>
              {t.label} <span className={`ml-1 text-xs ${f.state === t.key ? "text-[#d0ebe8]" : "text-slate-400"}`}>{t.key ? counts[t.key] ?? 0 : total}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-52 flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={f.search} onChange={(e) => set({ search: e.target.value })} placeholder="Tìm theo mã hoặc tiêu đề" className={`${inputCls} w-full pl-9`} /></div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <QueryBoundary query={query} isEmpty={!query.data?.data?.length} emptyText="Không có mã giảm giá phù hợp." height="h-64">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Mã", "Mức giảm", "Điều kiện", "Sử dụng", "Hiệu lực", "Trạng thái", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {query.data?.data?.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">{c.code}{c.featured && <Star size={13} className="fill-amber-400 text-amber-400" aria-label="Nổi bật" />}</p>
                      <p className="max-w-[200px] truncate text-xs text-slate-400">{c.title}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{discountText(c)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{c.minBookingAmount ? `Đơn từ ${money(c.minBookingAmount)}` : "Mọi đơn"}</td>
                    <td className="px-4 py-3"><Usage c={c} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</td>
                    <td className="px-4 py-3"><div className="flex flex-col items-start gap-1"><Badge value={c.state} />{c.scheduled && <Badge value="SCHEDULED" />}</div></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setForm({ coupon: c })} title="Sửa" className="rounded-lg border p-1.5 text-slate-600"><Pencil size={14} /></button>
                        {c.state !== "EXPIRED" && (
                          <button onClick={() => setAction({ type: "toggle", coupon: c })} title={c.status === "ACTIVE" ? "Tắt mã" : "Bật mã"} className={`rounded-lg border p-1.5 ${c.status === "ACTIVE" ? "text-amber-600" : "text-emerald-600"}`}><Power size={14} /></button>
                        )}
                        {c.usedCount === 0 && <button onClick={() => setAction({ type: "delete", coupon: c })} title="Xoá" className="rounded-lg border p-1.5 text-red-600"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={query.data?.pagination} onChange={(page) => set({ page })} />
        </QueryBoundary>
      </div>

      {form && <CouponForm coupon={form.coupon} onClose={() => setForm(null)} />}
      {action?.type === "toggle" && (
        <ConfirmModal
          title={action.coupon.status === "ACTIVE" ? "Tắt mã giảm giá" : "Bật mã giảm giá"} description={`${action.coupon.code} — ${action.coupon.status === "ACTIVE" ? "khách hàng sẽ không dùng được mã này nữa." : "khách hàng có thể dùng lại mã trong thời gian hiệu lực."}`}
          confirmLabel={action.coupon.status === "ACTIVE" ? "Tắt mã" : "Bật mã"} danger={action.coupon.status === "ACTIVE"}
          onConfirm={() => toggle.mutateAsync({ id: action.coupon._id, status: action.coupon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })} onClose={() => setAction(null)} />
      )}
      {action?.type === "delete" && (
        <ConfirmModal title="Xoá mã giảm giá" danger confirmLabel="Xoá" description={`Xoá vĩnh viễn mã ${action.coupon.code}? Thao tác này không thể hoàn tác.`}
          onConfirm={() => remove.mutateAsync(action.coupon._id)} onClose={() => setAction(null)} />
      )}
    </div>
  );
}
