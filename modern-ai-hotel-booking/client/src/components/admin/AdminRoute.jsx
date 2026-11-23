
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute({ children }) {
  const {
    user,
    isAuthenticated,
    sessionChecking,
  } = useAuth();

  // Đợi xác minh phiên đăng nhập khi F5
  if (sessionChecking) {
    return <div>Đang kiểm tra phiên đăng nhập...</div>;
  }

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Không có quyền Admin
  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}
