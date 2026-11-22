import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToWishlist, getWishlistIds, removeFromWishlist } from "../api/wishlistApi";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

const NO_IDS = [];

/**
 * Lưu id các khách sạn đã thích để mọi nơi (thẻ khách sạn, trang chi tiết, trang Wishlist)
 * dùng chung một trạng thái và chỉ cần một request khi đăng nhập.
 */
export function WishlistProvider({ children }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState({ token: null, ids: NO_IDS });

  // Chỉ dùng danh sách của đúng phiên đăng nhập hiện tại, tránh hiện nhầm tim của người khác
  const likedIds = wishlist.token === token ? wishlist.ids : NO_IDS;

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    getWishlistIds()
      .then((data) => {
        if (!cancelled) setWishlist({ token, ids: data.ids });
      })
      .catch(() => {
        // Không tải được thì các tim hiển thị trống, người dùng vẫn bấm thích được
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isLiked = useCallback((hotelId) => likedIds.includes(hotelId), [likedIds]);

  /**
   * Đặt rõ trạng thái thích / bỏ thích. Cập nhật tim ngay, lỗi thì trả về như cũ.
   * Trả về true nếu thành công; chưa đăng nhập thì chuyển sang trang đăng nhập.
   */
  const setLike = useCallback(
    async (hotelId, liked) => {
      if (!token) {
        navigate("/login");
        return false;
      }

      const previous = likedIds.includes(hotelId);

      const apply = (value) =>
        setWishlist((prev) => {
          const others = (prev.token === token ? prev.ids : NO_IDS).filter((id) => id !== hotelId);

          return { token, ids: value ? [...others, hotelId] : others };
        });

      apply(liked);

      try {
        await (liked ? addToWishlist(hotelId) : removeFromWishlist(hotelId));
        return true;
      } catch {
        apply(previous);
        return false;
      }
    },
    [token, likedIds, navigate],
  );

  const toggleLike = useCallback(
    (hotelId) => setLike(hotelId, !likedIds.includes(hotelId)),
    [setLike, likedIds],
  );

  const value = useMemo(() => ({ isLiked, setLike, toggleLike }), [isLiked, setLike, toggleLike]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) throw new Error("useWishlist phải được dùng bên trong WishlistProvider.");

  return context;
};
