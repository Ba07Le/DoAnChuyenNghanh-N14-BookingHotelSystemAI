import { useEffect, useState } from "react";
import {
  X,
  SlidersHorizontal,
  Star,
  MapPin,
  Building2,
  BedDouble,
  Wifi,
  Wind,
  Tv,
  Bath,
  RotateCcw,
} from "lucide-react";

const FilterDrawer = ({ isOpen, onClose, onApply }) => {
  const [filters, setFilters] = useState({
    cities: [],
    hotelTypes: [],
    stars: [],
    minPrice: "",
    maxPrice: "",
    rating: "",
    bedTypes: [],
    amenities: [],
  });

  const toggleArrayValue = (key, value) => {
    setFilters((prev) => {
      const current = prev[key];

      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      cities: [],
      hotelTypes: [],
      stars: [],
      minPrice: "",
      maxPrice: "",
      rating: "",
      bedTypes: [],
      amenities: [],
    });
  };

  const handleApply = () => {
    onApply?.(filters);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Đóng bộ lọc"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />

      {/* Drawer */}
      <aside
        className="
          absolute left-0 top-0 h-full
          w-[390px] max-w-[92vw]
          bg-white shadow-2xl
          animate-[slideIn_.3s_ease-out]
        "
      >
        {/* Header */}
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <SlidersHorizontal size={19} className="text-slate-700" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Bộ lọc</h2>

              <p className="text-xs text-slate-400">
                Tùy chỉnh kết quả tìm kiếm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-148px)] overflow-y-auto px-6 py-6">
          {/* Điểm đến */}
          <FilterSection icon={<MapPin size={17} />} title="Điểm đến">
            <div className="space-y-3">
              {[
                "Hà Nội",
                "Đà Nẵng",
                "Nha Trang",
                "TP. Hồ Chí Minh",
                "Phú Quốc",
                "Hội An",
              ].map((city) => (
                <CheckboxItem
                  key={city}
                  label={city}
                  checked={filters.cities.includes(city)}
                  onChange={() => toggleArrayValue("cities", city)}
                />
              ))}
            </div>
          </FilterSection>

          {/* =========================================
              LOẠI HÌNH LƯU TRÚ - THÊM MỚI
              ========================================= */}
          <FilterSection
            icon={<Building2 size={17} />}
            title="Loại hình lưu trú"
          >
            <div className="space-y-3">
              {[
                {
                  value: "HOTEL",
                  label: "Khách sạn",
                },
                {
                  value: "RESORT",
                  label: "Resort",
                },
                {
                  value: "VILLA",
                  label: "Villa",
                },
                {
                  value: "APARTMENT",
                  label: "Căn hộ",
                },
                {
                  value: "HOMESTAY",
                  label: "Homestay",
                },
                {
                  value: "BOUTIQUE",
                  label: "Boutique Hotel",
                },
              ].map((type) => (
                <CheckboxItem
                  key={type.value}
                  label={type.label}
                  checked={filters.hotelTypes.includes(type.value)}
                  onChange={() => toggleArrayValue("hotelTypes", type.value)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Hạng sao */}
          <FilterSection icon={<Star size={17} />} title="Hạng sao">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => (
                <CheckboxItem
                  key={star}
                  checked={filters.stars.includes(star)}
                  onChange={() => toggleArrayValue("stars", star)}
                >
                  <span className="flex items-center gap-1">
                    {Array.from({ length: star }).map((_, index) => (
                      <Star
                        key={index}
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                  </span>
                </CheckboxItem>
              ))}
            </div>
          </FilterSection>

          {/* Giá */}
          <FilterSection title="Khoảng giá / đêm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Giá từ
                </label>

                <input
                  type="number"
                  min="0"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  placeholder="500.000"
                  className="
                    w-full rounded-xl
                    border border-slate-200
                    px-3 py-2.5
                    text-sm text-slate-900
                    outline-none
                    transition
                    focus:border-slate-400
                    focus:ring-2
                    focus:ring-slate-100
                  "
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Giá đến
                </label>

                <input
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  placeholder="5.000.000"
                  className="
                    w-full rounded-xl
                    border border-slate-200
                    px-3 py-2.5
                    text-sm text-slate-900
                    outline-none
                    transition
                    focus:border-slate-400
                    focus:ring-2
                    focus:ring-slate-100
                  "
                />
              </div>
            </div>
          </FilterSection>

          {/* Rating */}
          <FilterSection icon={<Star size={17} />} title="Đánh giá khách hàng">
            <div className="space-y-3">
              {[
                {
                  value: 4.5,
                  label: "4.5 trở lên",
                },
                {
                  value: 4,
                  label: "4.0 trở lên",
                },
                {
                  value: 3.5,
                  label: "3.5 trở lên",
                },
                {
                  value: 3,
                  label: "3.0 trở lên",
                },
              ].map((item) => (
                <label
                  key={item.value}
                  className="
                    flex cursor-pointer
                    items-center gap-3
                    text-sm text-slate-600
                  "
                >
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.rating === item.value}
                    onChange={() => updateFilter("rating", item.value)}
                    className="h-4 w-4 border-slate-300"
                  />

                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Bed */}
          <FilterSection icon={<BedDouble size={17} />} title="Loại giường">
            <div className="space-y-3">
              {["1 King Bed", "2 Twin Beds", "1 King Bed + Sofa Bed"].map(
                (bed) => (
                  <CheckboxItem
                    key={bed}
                    label={bed}
                    checked={filters.bedTypes.includes(bed)}
                    onChange={() => toggleArrayValue("bedTypes", bed)}
                  />
                ),
              )}
            </div>
          </FilterSection>

          {/* Amenities */}
          <FilterSection title="Tiện nghi">
            <div className="space-y-3">
              <AmenityItem
                icon={<Wifi size={16} />}
                label="Wi-Fi"
                checked={filters.amenities.includes("wifi")}
                onChange={() => toggleArrayValue("amenities", "wifi")}
              />

              <AmenityItem
                icon={<Wind size={16} />}
                label="Máy lạnh"
                checked={filters.amenities.includes("air-conditioning")}
                onChange={() =>
                  toggleArrayValue("amenities", "air-conditioning")
                }
              />

              <AmenityItem
                icon={<Tv size={16} />}
                label="Smart TV"
                checked={filters.amenities.includes("smart-tv")}
                onChange={() => toggleArrayValue("amenities", "smart-tv")}
              />

              <AmenityItem
                icon={<Bath size={16} />}
                label="Bồn tắm"
                checked={filters.amenities.includes("bathtub")}
                onChange={() => toggleArrayValue("amenities", "bathtub")}
              />
            </div>
          </FilterSection>
        </div>

        {/* Footer */}
        <div
          className="
          absolute bottom-0 left-0 right-0
          border-t border-slate-100
          bg-white px-6 py-4
        "
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="
                flex-1 rounded-xl
                border border-slate-200
                px-4 py-3
                text-sm font-semibold
                text-slate-600
                transition
                hover:bg-slate-50
              "
            >
              <span className="flex items-center justify-center gap-2">
                <RotateCcw size={15} />
                Xóa
              </span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="
                flex-[1.5]
                rounded-xl
                bg-slate-900
                px-4 py-3
                text-sm font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-slate-800
                active:scale-[0.98]
              "
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

const FilterSection = ({ icon, title, children }) => (
  <section
    className="
    border-b border-slate-100
    py-6
    first:pt-0
  "
  >
    <div className="mb-4 flex items-center gap-2">
      {icon && <span className="text-slate-500">{icon}</span>}

      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>

    {children}
  </section>
);

const CheckboxItem = ({ label, checked, onChange, children }) => (
  <label
    className="
    flex cursor-pointer
    items-center gap-3
    text-sm text-slate-600
  "
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="
        h-4 w-4
        rounded
        border-slate-300
        accent-slate-900
      "
    />

    {children || <span>{label}</span>}
  </label>
);

const AmenityItem = ({ icon, label, checked, onChange }) => (
  <label
    className="
    flex cursor-pointer
    items-center gap-3
    text-sm text-slate-600
  "
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="
        h-4 w-4
        rounded
        border-slate-300
        accent-slate-900
      "
    />

    <span className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>

      {label}
    </span>
  </label>
);

export default FilterDrawer;
