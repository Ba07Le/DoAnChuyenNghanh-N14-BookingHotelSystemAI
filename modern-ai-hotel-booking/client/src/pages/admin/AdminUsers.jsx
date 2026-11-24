import { useState } from "react";
import { Lock, Unlock, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAdminUsers, useAdminUser, useSetUserStatus } from "../../hooks/useAdmin";
import { Badge, QueryBoundary, Pagination, ConfirmModal, Modal, Field, useDebounce, fmtDate, money, LABELS, inputCls, selectCls } from "../../components/admin/ui";

function UserDetail({ id, onClose }) {
  const q = useAdminUser(id);
  const u = q.data?.data;
  return (
    <Modal title="Chi tiết người dùng" onClose={onClose} wide>
      <QueryBoundary query={q}>
        {u && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Họ tên">{u.fullName}</Field><Field label="Email">{u.email}</Field>
              <Field label="Điện thoại">{u.phone}</Field><Field label="Ngày đăng ký">{fmtDate(u.createdAt)}</Field>
              <Field label="Vai trò"><Badge value={u.role} /></Field><Field label="Trạng thái"><Badge value={u.status} /></Field>
              <Field label="Số đặt phòng">{u.stats.bookingCount}</Field><Field label="Tổng chi tiêu">{money(u.stats.totalSpent)}</Field>
              {u.role === "HOTEL_OWNER" && <Field label="Số khách sạn sở hữu">{u.stats.hotelCount}</Field>}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">5 đặt phòng gần nhất</p>
              {u.recentBookings.length ? (
                <ul className="divide-y rounded-xl border text-sm">
                  {u.recentBookings.map((b) => (
                    <li key={b._id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                      <span><b>{b.bookingCode}</b> · {b.hotelId?.name}</span><span className="flex items-center gap-2"><Badge value={b.status} />{money(b.totalAmount)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">Chưa có đặt phòng.</p>}
            </div>
          </div>
        )}
      </QueryBoundary>
    </Modal>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const myId = String(me?.id || me?._id);
  const [f, setF] = useState({ search: "", role: "", status: "", page: 1 });
  const search = useDebounce(f.search);
  const query = useAdminUsers({ search, role: f.role, status: f.status, page: f.page, limit: 10 });
  const mutation = useSetUserStatus();
  const [target, setTarget] = useState(null); // { user, status }
  const [detailId, setDetailId] = useState(null);
  const set = (patch) => setF((s) => ({ ...s, ...patch, page: patch.page ?? 1 }));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1><p className="text-sm text-slate-500">Khoá hoặc mở khoá tài khoản. Tài khoản bị khoá sẽ bị đăng xuất ở yêu cầu kế tiếp.</p></div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={f.search} onChange={(e) => set({ search: e.target.value })} placeholder="Tìm theo tên, email, số điện thoại" className={`${inputCls} w-full pl-9`} /></div>
        <select value={f.role} onChange={(e) => set({ role: e.target.value })} className={selectCls}>
          <option value="">Mọi vai trò</option>{["CUSTOMER", "HOTEL_OWNER", "ADMIN"].map((r) => <option key={r} value={r}>{LABELS[r]}</option>)}
        </select>
        <select value={f.status} onChange={(e) => set({ status: e.target.value })} className={selectCls}>
          <option value="">Mọi trạng thái</option>{["ACTIVE", "INACTIVE", "BLOCKED"].map((r) => <option key={r} value={r}>{LABELS[r]}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <QueryBoundary query={query} isEmpty={!query.data?.data?.length} emptyText="Không tìm thấy người dùng phù hợp." height="h-64">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Người dùng", "Vai trò", "Trạng thái", "Đặt phòng", "Ngày tạo", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {query.data?.data?.map((u) => {
                  const canToggle = String(u._id) !== myId && u.role !== "ADMIN";
                  const blocked = u.status === "BLOCKED";
                  return (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><button onClick={() => setDetailId(u._id)} className="text-left"><p className="font-semibold text-slate-900 hover:text-[#087e83]">{u.fullName}</p><p className="text-xs text-slate-400">{u.email}</p></button></td>
                      <td className="px-4 py-3"><Badge value={u.role} /></td>
                      <td className="px-4 py-3"><Badge value={u.status} /></td>
                      <td className="px-4 py-3">{u.bookingCount}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {canToggle && (
                          <button onClick={() => setTarget({ user: u, status: blocked ? "ACTIVE" : "BLOCKED" })} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${blocked ? "text-emerald-600" : "text-red-600"}`}>
                            {blocked ? <><Unlock size={14} />Mở khoá</> : <><Lock size={14} />Khoá</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination pagination={query.data?.pagination} onChange={(page) => set({ page })} />
        </QueryBoundary>
      </div>

      {target && (
        <ConfirmModal
          title={target.status === "BLOCKED" ? "Khoá tài khoản" : "Mở khoá tài khoản"}
          description={`${target.user.fullName} (${target.user.email})`}
          askReason={target.status === "BLOCKED"} reasonLabel="Lý do khoá" danger={target.status === "BLOCKED"}
          confirmLabel={target.status === "BLOCKED" ? "Khoá" : "Mở khoá"}
          onConfirm={(reason) => mutation.mutateAsync({ id: target.user._id, status: target.status, reason })}
          onClose={() => setTarget(null)}
        />
      )}
      {detailId && <UserDetail id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
