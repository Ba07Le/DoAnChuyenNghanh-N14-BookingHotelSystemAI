import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Check, X, EyeOff, Eye, Search } from "lucide-react";
import { useAdminHotels, useAdminHotel, useApproveHotel, useRejectHotel, useSetHotelStatus } from "../../hooks/useAdmin";
import { Badge, QueryBoundary, Pagination, ConfirmModal, Modal, Field, useDebounce, fmtDate, money, LABELS, inputCls } from "../../components/admin/ui";

const TABS = ["PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED", "DRAFT"];

function HotelDetail({ id, onClose }) {
  const q = useAdminHotel(id);
  const h = q.data?.data;
  return (
    <Modal title="Chi tiết khách sạn" onClose={onClose} wide>
      <QueryBoundary query={q}>
        {h && (
          <div className="space-y-5">
            {h.images?.[0]?.url && <img src={h.images[0].url} alt="" className="h-48 w-full rounded-xl object-cover" />}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên">{h.name}</Field><Field label="Trạng thái"><Badge value={h.status} /></Field>
              <Field label="Địa chỉ">{[h.address?.addressLine, h.address?.district, h.address?.city].filter(Boolean).join(", ")}</Field>
              <Field label="Hạng sao / loại">{h.starRating}★ · {h.hotelTypeId?.name}</Field>
              <Field label="Chủ khách sạn">{h.ownerId?.fullName} ({h.ownerId?.email})</Field><Field label="Liên hệ">{h.contact?.phone}</Field>
              <Field label="Tiện nghi">{h.amenities?.map((a) => a.name).join(", ")}</Field>
              <Field label="Booking">{Object.entries(h.bookingStats).map(([k, v]) => `${LABELS[k]}: ${v}`).join(" · ") || "Chưa có"}</Field>
            </div>
            {h.rejectReason && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600"><b>Lý do từ chối:</b> {h.rejectReason}</p>}
            {h.description && <p className="text-sm text-slate-600">{h.description}</p>}
            <div>
              <p className="mb-2 text-sm font-semibold">Loại phòng ({h.roomTypes.length})</p>
              <ul className="divide-y rounded-xl border text-sm">
                {h.roomTypes.map((r) => <li key={r._id} className="flex justify-between p-3"><span>{r.name} · {r.capacity?.total} khách · {r.totalRooms} phòng</span><b>{money(r.basePrice)}</b></li>)}
                {!h.roomTypes.length && <li className="p-3 text-slate-400">Chưa có loại phòng.</li>}
              </ul>
            </div>
          </div>
        )}
      </QueryBoundary>
    </Modal>
  );
}

export default function AdminHotels() {
  const [sp, setSp] = useSearchParams();
  const status = sp.get("status") || "PENDING_APPROVAL";
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const search = useDebounce(searchText);
  const query = useAdminHotels({ status, search, page, limit: 8 });
  const approve = useApproveHotel(), reject = useRejectHotel(), setVis = useSetHotelStatus();
  const [action, setAction] = useState(null); // { type, hotel }
  const [detailId, setDetailId] = useState(null);
  const counts = query.data?.statusCounts || {};

  const configs = {
    approve: { title: "Duyệt khách sạn", confirmLabel: "Duyệt", run: (h) => approve.mutateAsync(h._id), desc: "Khách sạn sẽ hiển thị với khách hàng và chủ khách sạn nhận được thông báo." },
    reject: { title: "Từ chối khách sạn", confirmLabel: "Từ chối", danger: true, askReason: true, run: (h, reason) => reject.mutateAsync({ id: h._id, reason }), desc: "Lý do sẽ được gửi tới chủ khách sạn." },
    suspend: { title: "Tạm ngưng khách sạn", confirmLabel: "Tạm ngưng", danger: true, run: (h) => setVis.mutateAsync({ id: h._id, status: "SUSPENDED" }), desc: "Khách sạn sẽ bị ẩn khỏi trang khách hàng. Các đặt phòng sắp tới không tự động bị huỷ." },
    restore: { title: "Mở lại khách sạn", confirmLabel: "Mở lại", run: (h) => setVis.mutateAsync({ id: h._id, status: "APPROVED" }), desc: "Khách sạn sẽ hiển thị lại với khách hàng." },
  };
  const cfg = action && configs[action.type];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-900">Duyệt & quản lý khách sạn</h1></div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap rounded-xl bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button key={t} onClick={() => { setSp({ status: t }); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${status === t ? "bg-blue-600 text-white" : "text-slate-600"}`}>
              {LABELS[t]} <span className={`ml-1 text-xs ${status === t ? "text-blue-100" : "text-slate-400"}`}>{counts[t] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-52 flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1); }} placeholder="Tìm theo tên hoặc thành phố" className={`${inputCls} w-full pl-9`} /></div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <QueryBoundary query={query} isEmpty={!query.data?.data?.length} emptyText="Không có khách sạn nào ở trạng thái này." height="h-64">
          <ul className="divide-y">
            {query.data?.data?.map((h) => (
              <li key={h._id} className="flex flex-wrap items-center gap-4 p-4">
                <img src={h.images?.[0]?.url} alt="" className="h-16 w-24 rounded-lg bg-slate-100 object-cover" />
                <div className="min-w-0 flex-1">
                  <button onClick={() => setDetailId(h._id)} className="text-left font-semibold text-slate-900 hover:text-blue-600">{h.name}</button>
                  <p className="text-xs text-slate-400">{h.address?.city} · {h.starRating}★ · Chủ: {h.ownerId?.fullName} · Nộp {fmtDate(h.createdAt)}</p>
                  {h.status === "REJECTED" && h.rejectReason && <p className="mt-1 text-xs text-red-500">Lý do: {h.rejectReason}</p>}
                </div>
                <Badge value={h.status} />
                <div className="flex gap-2">
                  {h.status === "PENDING_APPROVAL" && <>
                    <button onClick={() => setAction({ type: "approve", hotel: h })} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"><Check size={14} />Duyệt</button>
                    <button onClick={() => setAction({ type: "reject", hotel: h })} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-red-600"><X size={14} />Từ chối</button>
                  </>}
                  {h.status === "APPROVED" && <>
                    <Link to={`/hotels/${h.slug}`} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600">Xem trang</Link>
                    <button onClick={() => setAction({ type: "suspend", hotel: h })} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-red-600"><EyeOff size={14} />Tạm ngưng</button>
                  </>}
                  {h.status === "SUSPENDED" && <button onClick={() => setAction({ type: "restore", hotel: h })} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-emerald-600"><Eye size={14} />Mở lại</button>}
                </div>
              </li>
            ))}
          </ul>
          <Pagination pagination={query.data?.pagination} onChange={setPage} />
        </QueryBoundary>
      </div>

      {action && (
        <ConfirmModal title={cfg.title} description={`${action.hotel.name}. ${cfg.desc}`} confirmLabel={cfg.confirmLabel} danger={cfg.danger} askReason={cfg.askReason} reasonLabel="Lý do từ chối"
          onConfirm={(reason) => cfg.run(action.hotel, reason)} onClose={() => setAction(null)} />
      )}
      {detailId && <HotelDetail id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
