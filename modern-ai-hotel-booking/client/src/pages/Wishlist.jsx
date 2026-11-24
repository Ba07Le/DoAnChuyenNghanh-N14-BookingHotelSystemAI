import {
  Heart,
  MapPin,
  RefreshCw,
  Search,
  X,
  ArrowUpRight,
  Building2,
  Star,
  Compass,
  LoaderCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getImageUrl } from "../utils/imageUrl";
import { getWishlist } from "../api/wishlistApi";
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
    savedAt: item.savedAt,
  };
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

function Wishlist() {
  const { setLike } = useWishlist();

  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("recent");
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
        if (
          city &&
          items.filter((item) => item.hotel.address?.city === city).length ===
            1 &&
          items.some(
            (item) =>
              item.hotelId === hotelId && item.hotel.address?.city === city,
          )
        )
          setCity("");
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

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const cities = [
    ...new Set(items.map(({ hotel }) => hotel.address?.city).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "vi"));
  const visible = items.filter(
    ({ hotel }) =>
      (!city || hotel.address?.city === city) &&
      normalize(`${hotel.name || ""} ${hotel.address?.city || ""}`).includes(
        normalize(query.trim()),
      ),
  );
  if (sort === "name")
    visible.sort((a, b) =>
      (a.hotel.name || "").localeCompare(b.hotel.name || "", "vi"),
    );
  if (sort === "rating")
    visible.sort(
      (a, b) =>
        (Number(b.hotel.averageRating) || 0) -
        (Number(a.hotel.averageRating) || 0),
    );
  const reset = () => {
    setQuery("");
    setCity("");
    setSort("recent");
  };

  return (
    <section className="sy-wish-page" aria-labelledby="wish-title">
      <header className="sy-wish-heading">
        <div>
          <p className="sy-wish-kicker">YOUR PERSONAL COLLECTION</p>
          <h1 id="wish-title">Danh sách yêu thích</h1>
          <p>Lưu giữ những nơi bạn muốn đến, cho hành trình của riêng mình.</p>
        </div>
        <Link to="/hotels" className="sy-wish-primary">
          Khám phá khách sạn <ArrowUpRight size={17} />
        </Link>
      </header>
      {!loading && !error && (
        <div className="sy-wish-summary">
          <div className="sy-wish-summary-icon">
            <Heart size={25} />
          </div>
          <div>
            <p>BỘ SƯU TẬP CỦA BẠN</p>
            <strong>{items.length} nơi lưu trú đã lưu</strong>
            <span>{cities.length} điểm đến trong danh sách</span>
          </div>
          <Compass className="sy-wish-decor" size={92} aria-hidden="true" />
        </div>
      )}
      {error && (
        <div className="sy-wish-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadWishlist} disabled={loading}>
            <RefreshCw size={15} /> Thử lại
          </button>
        </div>
      )}
      {loading ? (
        <div
          className="sy-wish-grid"
          role="status"
          aria-label="Đang tải danh sách yêu thích"
        >
          {[1, 2, 3].map((n) => (
            <div key={n} className="sy-wish-skeleton" />
          ))}
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <>
              <div className="sy-wish-toolbar">
                <label className="sy-wish-search">
                  <Search size={18} />
                  <input
                    aria-label="Tìm khách sạn yêu thích"
                    placeholder="Tìm tên khách sạn, điểm đến..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Xóa từ khóa"
                      onClick={() => setQuery("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>
                <div className="sy-wish-selects">
                  <label>
                    <span>Điểm đến</span>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="">Tất cả</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Sắp xếp</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="recent">Mới lưu</option>
                      <option value="name">Tên A–Z</option>
                      <option value="rating">Đánh giá cao</option>
                    </select>
                  </label>
                </div>
              </div>
              <p className="sy-wish-count" aria-live="polite">
                {visible.length}/{items.length} nơi lưu trú
              </p>
              <div className="sy-wish-grid">
                {visible.map(({ id, hotelId, hotel, savedAt }) => {
                  const image = getImageUrl(
                    hotel.images?.[0]?.url || hotel.images?.[0] || "",
                  );
                  const removing = removingId === hotelId;
                  const date =
                    savedAt && !Number.isNaN(new Date(savedAt).getTime())
                      ? new Date(savedAt).toLocaleDateString("vi-VN")
                      : "";
                  return (
                    <article key={id} className="sy-wish-card">
                      <div className="sy-wish-photo">
                        <Building2 size={36} aria-hidden="true" />
                        {image && (
                          <img
                            src={image}
                            alt={hotel.name || "Khách sạn"}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        {Number(hotel.starRating) > 0 && (
                          <span className="sy-wish-stars">
                            <Star size={13} fill="currentColor" />{" "}
                            {hotel.starRating} sao
                          </span>
                        )}
                        <button
                          type="button"
                          className="sy-wish-heart"
                          onClick={() => handleRemove(hotelId)}
                          disabled={Boolean(removingId)}
                          aria-label={`Bỏ ${hotel.name || "khách sạn"} khỏi danh sách yêu thích`}
                          title="Bỏ khỏi danh sách yêu thích"
                        >
                          {removing ? (
                            <LoaderCircle size={20} className="sy-wish-spin" />
                          ) : (
                            <Heart size={20} fill="currentColor" />
                          )}
                        </button>
                      </div>
                      <div className="sy-wish-body">
                        <p className="sy-wish-location">
                          <MapPin size={15} />{" "}
                          {hotel.address?.city || "Chưa cập nhật địa điểm"}
                        </p>
                        <h2>{hotel.name || "Khách sạn"}</h2>
                        <p className="sy-wish-rating">
                          {Number(hotel.reviewCount) > 0 ? (
                            <>
                              <Star size={15} fill="currentColor" />
                              <strong>
                                {Number(hotel.averageRating || 0).toFixed(1)}
                              </strong>{" "}
                              · {hotel.reviewCount} đánh giá
                            </>
                          ) : (
                            "Chưa có đánh giá"
                          )}
                        </p>
                        <div className="sy-wish-bottom">
                          <span>
                            {date ? `Đã lưu ${date}` : "Đã lưu yêu thích"}
                          </span>
                          {hotel.slug ? (
                            <Link
                              to={`/hotels/${hotel.slug}`}
                              className="sy-wish-link"
                            >
                              Xem chi tiết <ArrowUpRight size={16} />
                            </Link>
                          ) : (
                            <span>Chưa có liên kết</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!visible.length && (
                <div className="sy-wish-empty">
                  <span>
                    <Search size={30} />
                  </span>
                  <h2>Không tìm thấy nơi lưu trú phù hợp</h2>
                  <p>Thử từ khóa hoặc điểm đến khác.</p>
                  <button
                    type="button"
                    className="sy-wish-primary"
                    onClick={reset}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </>
          )}
          {!items.length && !error && (
            <div className="sy-wish-empty sy-wish-empty-main">
              <div className="sy-wish-empty-art" aria-hidden="true">
                <Compass size={96} />
                <Heart size={40} />
              </div>
              <p className="sy-wish-kicker">MAKE YOUR NEXT ESCAPE</p>
              <h2>Những hành trình đẹp bắt đầu từ một nơi yêu thích.</h2>
              <p>
                Danh sách của bạn đang trống. Nhấn biểu tượng trái tim khi khám
                phá khách sạn để lưu lại những nơi bạn muốn đến.
              </p>
              <Link to="/hotels" className="sy-wish-primary">
                Khám phá khách sạn <ArrowUpRight size={17} />
              </Link>
              <Link to="/destinations" className="sy-wish-link">
                Tìm cảm hứng du lịch <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Wishlist;
