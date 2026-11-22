import { useState } from "react";
import { Search, Ban } from "lucide-react";
import { useAdminBookings, useAdminBooking, useCancelBooking } from "../../hooks/useAdmin";
import { Badge, QueryBoundary, Pagination, ConfirmModal, Modal, Field, useDebounce, fmtDate, fmtDateTime, money, LABELS, inputCls, selectCls } from "../../components/admin/ui";

const CANCELLABLE = ["PENDING", "CONFIRMED"]; // khớp với backend: CHECKED_IN, COMPLETED, CANCELLED không được huỷ

function BookingDetail({ id, onClose, onCancel }) {
  const q = useAdminBooking(id);
  const b = q.data?.data;
  return (
    <Modal title={b ? `Đặt phòng ${b.bookingCode}` : "Chi tiết đặt phòng"} onClose={onClose} wide>
      <QueryBoundary query={q}>
        {b && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Khách sạn">{b.hotelId?.name}</Field><Field label="Loại phòng">{b.roomTypeId?.name} × {b.rooms}</Field>
              <Field label="Khách">{b.guestInfo?.fullName} · {b.guestInfo?.email}</Field><Field label="Điện thoại">{b.guestInfo?.phone}</Field>
              <Field label="Nhận phòng → Trả phòng">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} ({b.nights} đêm)</Field>
              <Field label="Số khách">{b.guests?.adults} người lớn, {b.guests?.children} trẻ em</Field>
              <Field label="Trạng thái"><Badge value={b.status} /></Field><Field label="Thanh toán"><Badge value={b.paymentStatus} /></Field>
              <Field label="Tạm tính">{money(b.subtotal)}</Field><Field label="Giảm giá">{b.discount ? `-${money(b.discount)} (${b.couponCode || "—"})` : "—"}</Field>
              <Field label="Tổng tiền"><b>{money(b.totalAmount)}</b></Field><Field label="Ngày tạo">{fmtDateTime(b.createdAt)}</Field>
            </div>
            {b.guestInfo?.note && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Ghi chú: {b.guestInfo.note}</p>}
            <div className="rounded-xl border p-3 text-sm">
              <p className="mb-1 font-semibold">Thanh toán</p>
              {b.payment ? <p>{b.payment.method} · {b.payment.status} · {money(b.payment.amount)}{b.payment.paidAt ? ` · ${fmtDateTime(b.payment.paidAt)}` : ""}</p> : <p className="text-slate-400">Chưa có giao dịch.</p>}
            </div>
            {CANCELLABLE.includes(b.status) && (
              <div className="flex justify-end"><button onClick={() => onCancel(b)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-red-600"><Ban size={15} />Huỷ đặt phòng</button></div>
            )}
          </div>
        )}
      </QueryBoundary>
    </Modal>
  );
}

export default function AdminBookings() {
  const [f, setF] = useState({ search: "", status: "", paymentStatus: "", from: "", to: "", page: 1 });
  const search = useDebounce(f.search);
  const query = useAdminBookings({ ...f, search, limit: 10 });
  const cancel = useCancelBooking();
  const [detailId, setDetailId] = useState(null);
  const [target, setTarget] = useState(null);
  const set = (patch) => setF((s) => ({ ...s, ...patch, page: patch.page ?? 1 }));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-900">Quản lý đặt phòng</h1>
        <p className="text-sm text-slate-500">Admin chỉ xem và huỷ. Việc xác nhận đặt phòng do luồng thanh toán xử lý.</p></div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={f.search} onChange={(e) => set({ search: e.target.value })} placeholder="Mã đặt phòng, tên hoặc email khách" className={`${inputCls} w-full pl-9`} /></div>
        <select value={f.status} onChange={(e) => set({ status: e.target.value })} className={selectCls}>
          <option value="">Mọi trạng thái</option>{["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"].map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
        </select>
        <select value={f.paymentStatus} onChange={(e) => set({ paymentStatus: e.target.value })} className={selectCls}>
          <option value="">Mọi thanh toán</option>{["UNPAID", "PAID", "REFUNDED"].map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
        </select>
        <input type="date" value={f.from} max={f.to || undefined} onChange={(e) => set({ from: e.target.value })} className={selectCls} title="Từ ngày tạo" />
        <input type="date" value={f.to} min={f.from || undefined} onChange={(e) => set({ to: e.target.value })} className={selectCls} title="Đến ngày tạo" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <QueryBoundary query={query} isEmpty={!query.data?.data?.length} emptyText="Không tìm thấy đặt phòng phù hợp." height="h-64">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Mã", "Khách", "Khách sạn", "Lưu trú", "Tổng tiền", "Trạng thái", "Thanh toán", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {query.data?.data?.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-blue-600"><button onClick={() => setDetailId(b._id)}>{b.bookingCode}</button></td>
                    <td className="px-4 py-3"><p>{b.userId?.fullName || b.guestInfo?.fullName}</p><p className="text-xs text-slate-400">{b.userId?.email}</p></td>
                    <td className="px-4 py-3">{b.hotelId?.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{money(b.totalAmount)}</td>
                    <td className="px-4 py-3"><Badge value={b.status} /></td>
                    <td className="px-4 py-3"><Badge value={b.paymentStatus} /></td>
                    <td className="px-4 py-3 text-right">{CANCELLABLE.includes(b.status) && <button onClick={() => setTarget(b)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-red-600">Huỷ</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={query.data?.pagination} onChange={(page) => set({ page })} />
        </QueryBoundary>
      </div>

      {detailId && <BookingDetail id={detailId} onClose={() => setDetailId(null)} onCancel={(b) => { setDetailId(null); setTarget(b); }} />}
      {target && (
        <ConfirmModal title={`Huỷ đặt phòng ${target.bookingCode}`} danger askReason reasonLabel="Lý do huỷ" confirmLabel="Huỷ đặt phòng"
          description={`Phòng sẽ được trả lại kho${target.paymentStatus === "PAID" ? " và đơn được đánh dấu hoàn tiền" : ""}. Khách hàng sẽ nhận thông báo.`}
          onConfirm={(reason) => cancel.mutateAsync({ id: target._id, reason })} onClose={() => setTarget(null)} />
      )}
    </div>
  );
}
