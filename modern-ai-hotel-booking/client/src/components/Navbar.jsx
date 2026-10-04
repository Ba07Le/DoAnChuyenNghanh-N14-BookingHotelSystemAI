import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  User,
  Heart,
  Bell,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const navigate = useNavigate();

  const [openProfile, setOpenProfile] = useState(false);

  const handleLogout = () => {
    logout();
    setOpenProfile(false);
    navigate("/");
  };

  const navItems = [
    { name: "Trang chủ", path: "/" },
    { name: "Khách sạn", path: "/hotels" },
    { name: "Điểm đến", path: "/destinations" },
    { name: "Ưu đãi", path: "/deals" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-blue-600"
        >
          HOTEL<span className="text-slate-900">AI</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative py-6 text-sm font-medium transition ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.name}

                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-600" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Đăng nhập
              </Link>

              <Link
                to="/register"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Đăng ký
              </Link>
            </>
          ) : (
            <div className="relative">
              {/* Profile button */}
              <button
                onClick={() => setOpenProfile(!openProfile)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <User size={17} />
                  </div>
                )}

                <span className="hidden max-w-32 truncate text-sm font-semibold text-slate-700 sm:block">
                  {user?.fullName}
                </span>

                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition ${
                    openProfile ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {openProfile && (
                <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {/* User information */}
                  <div className="border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <User size={20} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {user?.fullName}
                        </p>

                        <p className="truncate text-sm text-slate-500">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setOpenProfile(false);
                        navigate("/profile");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <User size={18} />
                      Hồ sơ cá nhân
                    </button>

                    <button
                      onClick={() => {
                        setOpenProfile(false);
                        navigate("/bookings");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <CalendarDays size={18} />
                      Đặt phòng của tôi
                    </button>

                    <button
                      onClick={() => {
                        setOpenProfile(false);
                        navigate("/wishlist");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <Heart size={18} />
                      Wishlist
                    </button>

                    <button
                      onClick={() => {
                        setOpenProfile(false);
                        navigate("/notifications");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <Bell size={18} />
                      Thông báo
                    </button>

                    <button
                      onClick={() => {
                        setOpenProfile(false);
                        navigate("/settings");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <Settings size={18} />
                      Cài đặt
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100 p-2">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
