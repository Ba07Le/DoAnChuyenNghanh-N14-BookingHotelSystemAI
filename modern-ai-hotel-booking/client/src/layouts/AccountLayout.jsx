import { Bell, CalendarDays, Heart, Star, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { getUnreadCount } from "../api/notificationApi";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { name: "Hồ sơ cá nhân", path: "/profile", icon: User },
  { name: "Đặt phòng của tôi", path: "/bookings", icon: CalendarDays },
  { name: "Đánh giá của tôi", path: "/reviews", icon: Star },
  { name: "Wishlist", path: "/wishlist", icon: Heart },
  { name: "Thông báo", path: "/notifications", icon: Bell },
];

// Khung dùng chung cho các trang tài khoản: Hồ sơ, Đặt phòng, Wishlist, Thông báo
function AccountLayout() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Số thông báo chưa đọc hiện ở menu; trang Thông báo cập nhật lại qua Outlet context
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;

    getUnreadCount()
      .then((data) => {
        if (!cancelled) setUnreadCount(data.unreadCount);
      })
      .catch(() => {
        // Không lấy được số thì không hiện huy hiệu, không ảnh hưởng các trang khác
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-start">
        {/* Cột 1: menu tài khoản */}
        <aside className="lg:w-64 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
            {menuItems.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} />
                {name}

                {path === "/notifications" && unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Cột 2: nội dung của từng trang */}
        <section className="min-w-0 flex-1">
          <Outlet context={{ unreadCount, setUnreadCount }} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AccountLayout;
