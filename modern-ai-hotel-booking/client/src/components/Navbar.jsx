import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Building2,
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
    { name: "Ưu đãi", path: "/offers" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-extrabold tracking-tight text-blue-600"
            >
              HOTEL<span className="text-slate-900">AI</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative py-5 text-sm font-medium transition-colors duration-200 ${
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
                {/* Login */}
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100"
                >
                  Đăng nhập
                </Link>

                {/* Register */}
                <Link
                  to="/register"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
                >
                  Đăng ký
                </Link>
              </>
            ) : (
              <div className="relative">
                {/* Profile button */}
                <button
                  type="button"
                  onClick={() => setOpenProfile(!openProfile)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <User size={17} />
                    </div>
                  )}

                  <span className="hidden max-w-32 truncate text-sm font-semibold text-slate-700 sm:block">
                    {user?.fullName}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      openProfile ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {openProfile && (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    {/* User information */}
                    <div className="border-b border-slate-100 px-4 py-4">
                      <div className="flex items-center gap-3">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <User size={19} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user?.fullName}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu */}
                    <div className="p-2">
                      {/* Profile */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenProfile(false);
                          navigate("/profile");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <User size={18} />
                        Hồ sơ cá nhân
                      </button>

                      {/* Bookings */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenProfile(false);
                          navigate("/bookings");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <CalendarDays size={18} />
                        Đặt phòng của tôi
                      </button>

                      {/* Wishlist */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenProfile(false);
                          navigate("/wishlist");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Heart size={18} />
                        Wishlist
                      </button>

                      {/* Notifications */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenProfile(false);
                          navigate("/notifications");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Bell size={18} />
                        Thông báo
                      </button>

                      {/* Dashboard */}
                      {(user?.role === "ADMIN" || user?.role === "HOTEL_OWNER") && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenProfile(false);
                            navigate("/dashboard");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Building2 size={18} />
                          Dashboard
                        </button>
                      )}

                      {/* Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenProfile(false);
                          navigate("/settings");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Settings size={18} />
                        Cài đặt
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50"
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
    </>
  );
}

export default Navbar;
