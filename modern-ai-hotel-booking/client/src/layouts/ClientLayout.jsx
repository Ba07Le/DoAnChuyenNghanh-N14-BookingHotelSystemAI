import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { User, CalendarDays, Heart, Bell, Star, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "../styles/client-premium.css";

const links = [
  ["/profile", "Hồ sơ cá nhân", User],
  ["/bookings", "Đặt phòng của tôi", CalendarDays],
  ["/wishlist", "Danh sách yêu thích", Heart],
  ["/notifications", "Thông báo", Bell],
  ["/my-reviews", "Đánh giá của tôi", Star],
];
export default function ClientLayout() {
  const { pathname } = useLocation();
  return <div className={`seeyahh-client ${pathname === "/" ? "sy-home" : pathname === "/login" ? "sy-login" : "sy-inner"}`}><Outlet /></div>;
}
export function AccountLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return <div className="sy-account">
    <Navbar />
    <section className="sy-account-banner"><div className="sy-account-width">
      <Link to="/" className="sy-back"><ArrowLeft size={16}/> Trang chủ</Link>
      <p className="sy-eyebrow">YOUR TRAVEL SPACE</p>
      <h1>Không gian của bạn</h1><p>Quản lý tài khoản và những hành trình đáng nhớ.</p>
    </div></section>
    <div className="sy-account-width sy-account-grid">
      <aside className="sy-account-sidebar">
        <div className="sy-account-person"><div className="sy-avatar">{user?.avatar ? <img src={user.avatar} alt=""/> : (user?.fullName?.[0] || "S").toUpperCase()}</div><div className="min-w-0"><strong>{user?.fullName || "Khách hàng"}</strong><small>{user?.email || "SeeYAHH!"}</small></div></div>
        <nav aria-label="Tài khoản">{links.map(([to,label,Icon]) => <NavLink key={to} to={to} className={({isActive}) => `sy-account-link ${isActive || (to === "/my-reviews" && pathname.startsWith("/reviews")) ? "sy-active" : ""}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      </aside>
      <div className="sy-account-content"><Outlet /></div>
    </div><Footer />
  </div>;
}
