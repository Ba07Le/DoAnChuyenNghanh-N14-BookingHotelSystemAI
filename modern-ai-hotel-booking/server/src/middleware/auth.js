import jwt from "jsonwebtoken";
import User from "../models/User.js";
export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("-passwordHash").lean();
    if (!user || user.status !== "ACTIVE") return res.status(401).json({ success: false, message: "Phiên đăng nhập không còn hợp lệ." });
    req.user = user; next();
  } catch { return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." }); }
};
export const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ success: false, message: "Bạn không có quyền thực hiện thao tác này." });
