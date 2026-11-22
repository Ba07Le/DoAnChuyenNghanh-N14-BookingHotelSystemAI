import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import {
  addToWishlist,
  getWishlistIds,
  removeFromWishlist,
} from "../api/wishlistApi";

import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);
const NO_IDS = [];

export function WishlistProvider({ children }) {
  const { token, user, sessionVerified } = useAuth();
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState({
    token: null,
    ids: NO_IDS,
  });

  const [authRejectedToken, setAuthRejectedToken] = useState(null);

  const canLoad = Boolean(token && user && sessionVerified);
  const likedIds = canLoad && wishlist.token === token ? wishlist.ids : NO_IDS;

  useEffect(() => {
    if (!canLoad || authRejectedToken === token) {
      return undefined;
    }

    let cancelled = false;

    getWishlistIds()
      .then((data) => {
        if (cancelled) return;

        setWishlist({
          token,
          ids: Array.isArray(data?.ids) ? data.ids : [],
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setWishlist({
          token,
          ids: [],
        });

        if (error.response?.status === 401) {
          setAuthRejectedToken(token);
        } else {
          console.error(
            "Không thể tải Wishlist:",
            error.response?.data?.message || error.message,
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, canLoad, authRejectedToken]);

  const isLiked = useCallback(
    (hotelId) => likedIds.includes(String(hotelId)),
    [likedIds],
  );

  const setLike = useCallback(
    async (hotelId, liked) => {
      if (!canLoad || authRejectedToken === token) {
        navigate("/login");
        return false;
      }

      const id = String(hotelId);
      const previous = likedIds.includes(id);

      const apply = (value) => {
        setWishlist((prev) => {
          const current = prev.token === token ? prev.ids : NO_IDS;

          const others = current.filter((item) => String(item) !== id);

          return {
            token,
            ids: value ? [...others, id] : others,
          };
        });
      };

      apply(liked);

      try {
        if (liked) {
          await addToWishlist(id);
        } else {
          await removeFromWishlist(id);
        }

        return true;
      } catch (error) {
        apply(previous);

        if (error.response?.status === 401) {
          setAuthRejectedToken(token);
          navigate("/login");
        }

        return false;
      }
    },
    [token, canLoad, authRejectedToken, likedIds, navigate],
  );

  const toggleLike = useCallback(
    (hotelId) => setLike(hotelId, !isLiked(hotelId)),
    [setLike, isLiked],
  );

  const value = useMemo(
    () => ({
      isLiked,
      setLike,
      toggleLike,
    }),
    [isLiked, setLike, toggleLike],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist phải được dùng bên trong WishlistProvider.");
  }

  return context;
};
