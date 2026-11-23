import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Building2, CalendarCheck, Ticket, ScrollText, Home, LogOut, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePendingHotelCount } from "../../hooks/useAdmin";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/hotels", label: "Khách sạn", icon: Building2, badge: "pendingHotels" },
  { to: "/admin/destinations", label: "Điểm đến", icon: MapPin },
  { to: "/admin/bookings", label: "Đặt phòng", icon: CalendarCheck },
  { to: "/admin/coupons", label: "Mã giảm giá", icon: Ticket },
  { to: "/admin/audit-logs", label: "Nhật ký", icon: ScrollText },
];

const Badge = ({ n }) => (n > 0 ? <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700" aria-label={`${n} mục chờ xử lý`}>{n > 99 ? "99+" : n}</span> : null);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const pending = usePendingHotelCount().data ?? 0;
  const counts = { pendingHotels: pending };
  const current = items.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)));
  const initial = (user?.fullName || "A").trim().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-white p-4 md:flex">
        <Link to="/admin" className="mb-6 px-2 text-lg font-bold text-slate-900">HOTELAI <span className="text-blue-600">Admin</span></Link>
        <nav className="space-y-1">
          {items.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <Icon size={18} />{label}{badge && <Badge n={counts[badge]} />}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t pt-4">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"><Home size={18} />Về trang chủ</Link>
          <button onClick={() => { logout(); nav("/login"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"><LogOut size={18} />Đăng xuất</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {/* Thanh điều hướng cho màn hình nhỏ */}
        <nav className="flex gap-1 overflow-x-auto border-b bg-white p-2 md:hidden">
          {items.map(({ to, label, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}>
              {label}{badge && <Badge n={counts[badge]} />}
            </NavLink>
          ))}
        </nav>
        <header className="flex items-center justify-between border-b bg-white px-6 py-4">
          <p className="text-sm font-semibold text-slate-900">{current?.label || "Quản trị"}</p>
          <div className="flex items-center gap-3">
            {pending > 0 && <Link to="/admin/hotels?status=PENDING_APPROVAL" className="hidden rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 sm:block">{pending} khách sạn chờ duyệt</Link>}
            <p className="hidden text-sm text-slate-500 sm:block">Xin chào, <b className="text-slate-900">{user?.fullName}</b></p>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white" aria-hidden="true">{initial}</span>
          </div>
        </header>
        <main className="p-6"><Outlet /></main>
      </div>
    </div>
  );
}
