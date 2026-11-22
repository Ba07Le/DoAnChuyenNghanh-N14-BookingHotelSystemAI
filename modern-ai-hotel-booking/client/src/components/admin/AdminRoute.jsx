import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Chỉ chặn ở giao diện cho tiện; quyền thật vẫn do backend (authorize("ADMIN")) kiểm tra
export default function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}
