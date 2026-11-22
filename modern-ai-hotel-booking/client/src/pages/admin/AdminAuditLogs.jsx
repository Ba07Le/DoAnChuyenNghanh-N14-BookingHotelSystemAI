import { useState } from "react";
import { useAuditLogs } from "../../hooks/useAdmin";
import { QueryBoundary, Pagination, fmtDateTime, selectCls } from "../../components/admin/ui";

const ENTITIES = ["User", "Hotel", "Booking", "Coupon", "System"];
const ACTIONS = {
  USER_BLOCKED: "Khoá tài khoản", USER_ACTIVATED: "Mở khoá tài khoản", USER_DEACTIVATED: "Ngưng tài khoản", USER_ROLE_CHANGED: "Đổi vai trò",
  HOTEL_APPROVED: "Duyệt khách sạn", HOTEL_REJECTED: "Từ chối khách sạn", HOTEL_SUSPENDED: "Tạm ngưng khách sạn", HOTEL_RESTORED: "Mở lại khách sạn",
  BOOKING_CANCELLED_BY_ADMIN: "Huỷ đặt phòng",
  COUPON_CREATED: "Tạo mã giảm giá", COUPON_UPDATED: "Sửa mã giảm giá", COUPON_ACTIVATED: "Bật mã giảm giá", COUPON_DEACTIVATED: "Tắt mã giảm giá", COUPON_DELETED: "Xoá mã giảm giá",
};
const META_KEYS = { name: "Tên", email: "Email", reason: "Lý do", before: "Trước", after: "Sau", bookingCode: "Mã đặt phòng", refunded: "Hoàn tiền", upcomingBookings: "Đơn sắp tới", code: "Mã", fields: "Trường đã sửa", discountType: "Loại giảm", discountValue: "Giá trị" };
const fmtMeta = (v) => (typeof v === "boolean" ? (v ? "Có" : "Không") : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : v);

export default function AdminAuditLogs() {
  const [f, setF] = useState({ entity: "", action: "", from: "", to: "", page: 1 });
  const query = useAuditLogs({ ...f, limit: 15 });
  const set = (patch) => setF((s) => ({ ...s, ...patch, page: patch.page ?? 1 }));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-900">Nhật ký thao tác</h1><p className="text-sm text-slate-500">Mọi thao tác nhạy cảm của admin được ghi lại. Chỉ xem, không sửa hoặc xoá.</p></div>
      <div className="flex flex-wrap gap-3">
        <select value={f.entity} onChange={(e) => set({ entity: e.target.value })} className={selectCls}>
          <option value="">Mọi đối tượng</option>{ENTITIES.map((e) => <option key={e}>{e}</option>)}
        </select>
        <select value={f.action} onChange={(e) => set({ action: e.target.value })} className={selectCls}>
          <option value="">Mọi hành động</option>{Object.entries(ACTIONS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <input type="date" value={f.from} max={f.to || undefined} onChange={(e) => set({ from: e.target.value })} className={selectCls} />
        <input type="date" value={f.to} min={f.from || undefined} onChange={(e) => set({ to: e.target.value })} className={selectCls} />
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <QueryBoundary query={query} isEmpty={!query.data?.data?.length} emptyText="Chưa có nhật ký nào." height="h-64">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Chi tiết", "IP"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {query.data?.data?.map((l) => (
                  <tr key={l._id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3">{l.actorId?.fullName || "—"}<p className="text-xs text-slate-400">{l.actorId?.email}</p></td>
                    <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700" title={l.action}>{ACTIONS[l.action] || l.action}</span></td>
                    <td className="px-4 py-3">{l.entity}<p className="max-w-[140px] truncate text-xs text-slate-400" title={l.entityId}>{l.entityId}</p></td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-500"><pre className="whitespace-pre-wrap break-words font-sans">{Object.entries(l.metadata || {}).filter(([, v]) => v !== "" && v != null).map(([k, v]) => `${META_KEYS[k] || k}: ${fmtMeta(v)}`).join("\n")}</pre></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={query.data?.pagination} onChange={(page) => set({ page })} />
        </QueryBoundary>
      </div>
    </div>
  );
}
