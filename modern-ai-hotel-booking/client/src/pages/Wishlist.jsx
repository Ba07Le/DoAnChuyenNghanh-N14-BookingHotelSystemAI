import { Heart, MapPin, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getWishlist } from "../api/profileApi";
import { useWishlist } from "../context/WishlistContext";

// Chuẩn hóa dữ liệu từ API cũ và API mới
const normalizeWishlistItem = (item) => {
  const hotel = item.hotel || item.hotelId;

  if (!hotel || typeof hotel !== "object") {
    return null;
  }

  const hotelId = hotel._id || hotel.id;

  if (!hotelId) {
    return null;
  }

  return {
    id: item.id || item._id || hotelId,
    hotelId: String(hotelId),
    hotel,
  };
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

function Wishlist() {
  const { setLike } = useWishlist();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  // Tải danh sách khách sạn yêu thích
  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getWishlist();

      const rawItems = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.items)
          ? response.items
          : [];

      const normalizedItems = rawItems
        .map(normalizeWishlistItem)
        .filter(Boolean);

      setItems(normalizedItems);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách yêu thích."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Xóa khách sạn khỏi danh sách yêu thích
  const handleRemove = async (hotelId) => {
    if (!hotelId || removingId) return;

    try {
      setRemovingId(hotelId);
      setError("");

      // Đồng bộ trạng thái với WishlistContext
      const removed = await setLike(hotelId, false);

      if (removed) {
        setItems((previous) =>
          previous.filter((item) => item.hotelId !== hotelId),
        );
      } else {
        setError("Không thể bỏ khách sạn khỏi danh sách yêu thích.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Có lỗi xảy ra khi xóa khách sạn."));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Wishlist</h1>

        <p className="mt-2 text-sm text-slate-500">
          Những nơi lưu trú bạn đang quan tâm.
        </p>
      </div>

      {/* THÔNG BÁO LỖI */}
      {error && (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={loadWishlist}
            disabled={loading}
            className="inline-flex items-center gap-2 font-semibold text-red-700 hover:text-red-800 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Thử lại
          </button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className="h-48 animate-pulse bg-slate-200" />

              <div className="space-y-4 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* DANH SÁCH KHÁCH SẠN */}
          {items.length > 0 && (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map(({ id, hotelId, hotel }) => {
                const isRemoving = removingId === hotelId;

                const imageUrl =
                  hotel.images?.[0]?.url || hotel.images?.[0] || "";

                return (
                  <article
                    key={id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* ẢNH KHÁCH SẠN */}
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={hotel.name || "Khách sạn"}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-400">
                        Chưa có hình ảnh
                      </div>
                    )}

                    {/* THÔNG TIN KHÁCH SẠN */}
                    <div className="p-5">
                      <h2 className="line-clamp-2 font-bold text-slate-900">
                        {hotel.name || "Khách sạn"}
                      </h2>

                      <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin size={15} className="shrink-0" />

                        <span>
                          {hotel.address?.city || "Chưa cập nhật địa điểm"}
                        </span>
                      </p>

                      {/* HÀNH ĐỘNG */}
                      <div className="mt-5 flex items-center justify-between">
                        {hotel.slug ? (
                          <Link
                            to={`/hotels/${hotel.slug}`}
                            className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                          >
                            Xem chi tiết
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Chưa có liên kết
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemove(hotelId)}
                          disabled={Boolean(removingId)}
                          aria-label={`Bỏ ${hotel.name || "khách sạn"} khỏi wishlist`}
                          title="Bỏ khỏi danh sách yêu thích"
                          className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Heart
                            size={19}
                            className={
                              isRemoving
                                ? "animate-pulse fill-red-300"
                                : "fill-red-500"
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* DANH SÁCH TRỐNG */}
          {items.length === 0 && !error && (
            <div className="mt-10 rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <Heart size={30} className="text-red-400" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                Danh sách yêu thích đang trống
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Hãy khám phá và lưu lại những khách sạn bạn yêu thích.
              </p>

              <Link
                to="/hotels"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Khám phá khách sạn
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Wishlist;
