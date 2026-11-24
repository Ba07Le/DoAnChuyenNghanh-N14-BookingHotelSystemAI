import { useEffect, useState } from "react";
import {
  X,
  SlidersHorizontal,
  Star,
  MapPin,
  Building2,
  BedDouble,
  RotateCcw,
} from "lucide-react";
import { getFilterOptions } from "../../api/catalogApi";

const FilterDrawer = ({ isOpen, onClose, onApply, value }) => {
  const [options, setOptions] = useState({ destinations: [], hotelTypes: [], bedTypes: [], amenities: [] });
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setOptionsLoading(true);
    setOptionsError("");
    getFilterOptions()
      .then((response) => {
        if (!active) return;
        if (!response.success || !response.data) throw new Error("Dữ liệu bộ lọc không hợp lệ");
        setOptions(response.data);
      })
      .catch(() => { if (active) setOptionsError("Không thể tải danh mục bộ lọc. Vui lòng thử mở lại."); })
      .finally(() => { if (active) setOptionsLoading(false); });
    return () => { active = false; };
  }, [isOpen]);

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

  useEffect(() => {
    if (isOpen && value)
      setFilters({
        cities: [...(value.cities || [])],
        hotelTypes: [...(value.hotelTypes || [])],
        stars: [...(value.stars || [])],
        minPrice: value.minPrice ?? "",
        maxPrice: value.maxPrice ?? "",
        rating: value.rating ?? "",
        bedTypes: [...(value.bedTypes || [])],
        amenities: [...(value.amenities || [])],
      });
  }, [isOpen, value]);

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
    if (
      filters.minPrice !== "" &&
      filters.maxPrice !== "" &&
      Number(filters.minPrice) > Number(filters.maxPrice)
    ) {
      alert("Giá từ không được lớn hơn giá đến.");
      return;
    }
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
          sy-filter-drawer absolute left-0 top-0 h-full
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
          {optionsLoading && <p className="text-sm text-slate-500">Đang cập nhật dữ liệu bộ lọc...</p>}
          {optionsError && <p role="alert" className="text-sm text-red-600">{optionsError}</p>}
          {/* Điểm đến */}
          <FilterSection icon={<MapPin size={17} />} title="Điểm đến">
            <div className="space-y-3">
              {(options.destinations || []).map((item) => (
                <CheckboxItem
                  key={item.id || item.value}
                  label={item.label}
                  checked={filters.cities.includes(item.value)}
                  onChange={() => toggleArrayValue("cities", item.value)}
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
              {(options.hotelTypes || []).map((type) => (
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
              {(options.bedTypes || []).map((bed) => (
                <CheckboxItem
                  key={bed.value}
                  label={bed.label}
                  checked={filters.bedTypes.includes(bed.value)}
                  onChange={() => toggleArrayValue("bedTypes", bed.value)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Amenities */}
          <FilterSection title="Tiện nghi">
            <div className="space-y-3">
              {(options.amenities || []).map((amenity) => (
                <CheckboxItem
                  key={amenity.value}
                  label={amenity.label}
                  checked={filters.amenities.includes(amenity.value)}
                  onChange={() => toggleArrayValue("amenities", amenity.value)}
                />
              ))}
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

export default FilterDrawer;
