import { useEffect, useRef, useState } from "react";
import {
  X,
  SlidersHorizontal,
  Star,
  MapPin,
  Building2,
  BedDouble,
  RotateCcw,
  Search,
  ChevronDown,
  Wallet,
  Sparkles,
} from "lucide-react";
import { getFilterOptions } from "../../api/catalogApi";

const FilterDrawer = ({ isOpen, onClose, onApply, value }) => {
  const [citySearch, setCitySearch] = useState("");
  const [priceError, setPriceError] = useState("");
  const drawerRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  const [options, setOptions] = useState({
    destinations: [],
    hotelTypes: [],
    bedTypes: [],
    amenities: [],
  });
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
        if (!response.success || !response.data)
          throw new Error("Dữ liệu bộ lọc không hợp lệ");
        setOptions(response.data);
      })
      .catch(() => {
        if (active)
          setOptionsError(
            "Không thể tải danh mục bộ lọc. Vui lòng thử mở lại.",
          );
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
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
    if (key === "minPrice" || key === "maxPrice") setPriceError("");
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setPriceError("");
    setCitySearch("");
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
      [filters.minPrice, filters.maxPrice].some(
        (v) => v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0),
      )
    ) {
      setPriceError("Vui lòng nhập mức giá không âm.");
      return;
    }
    if (
      filters.minPrice !== "" &&
      filters.maxPrice !== "" &&
      Number(filters.minPrice) > Number(filters.maxPrice)
    ) {
      setPriceError("Giá từ không được lớn hơn giá đến.");
      return;
    }
    onApply?.(filters);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    setCitySearch("");
    setPriceError("");
    drawerRef.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        drawerRef.current?.querySelectorAll(
          "button:not([disabled]), input:not([disabled]), summary, [href], select:not([disabled])",
        ) || [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = items[0],
        last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        !drawerRef.current.contains(document.activeElement) ||
        document.activeElement === drawerRef.current ||
        (event.shiftKey && document.activeElement === first) ||
        (!event.shiftKey && document.activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      previousFocus?.focus?.();
    };
  }, [isOpen]);

  const count = Object.values(filters).reduce(
    (n, v) => n + (Array.isArray(v) ? v.length : v === "" ? 0 : 1),
    0,
  );
  const normalize = (text) =>
    String(text || "")
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const cities = (options.destinations || []).filter((item) =>
    normalize(item.label).includes(normalize(citySearch.trim())),
  );

  if (!isOpen) return null;

  return (
    <div className="sy-filter-overlay fixed inset-0 z-[100]">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Đóng bộ lọc"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sy-filter-title"
        className="sy-filter-drawer"
      >
        {/* Header */}
        <div className="sy-filter-header">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <SlidersHorizontal size={19} className="text-slate-700" />
            </div>

            <div>
              <p className="sy-filter-kicker">TAILOR YOUR STAY</p>
              <h2 id="sy-filter-title">Bộ lọc tìm kiếm</h2>

              <p className="text-xs text-slate-400">
                Tìm nơi lưu trú theo cách của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Đóng bộ lọc"
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
        <div className="sy-filter-scroll">
          {optionsLoading && (
            <p className="text-sm text-slate-500">
              Đang cập nhật dữ liệu bộ lọc...
            </p>
          )}
          {optionsError && (
            <p role="alert" className="text-sm text-red-600">
              {optionsError}
            </p>
          )}
          {/* Điểm đến */}
          <FilterSection
            icon={<MapPin size={17} />}
            title="Điểm đến"
            initialOpen
            count={filters.cities.length}
          >
            <div className="sy-filter-city-search">
              <Search size={16} />
              <input
                aria-label="Tìm điểm đến trong bộ lọc"
                placeholder="Tìm tỉnh, thành phố..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
              />
              {citySearch && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa"
                  onClick={() => setCitySearch("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="sy-filter-city-grid">
              {cities.map((item) => (
                <CheckboxItem
                  key={item.id || item.value}
                  label={item.label}
                  checked={filters.cities.includes(item.value)}
                  onChange={() => toggleArrayValue("cities", item.value)}
                />
              ))}
              {!cities.length && !optionsLoading && (
                <p className="text-xs text-slate-500">
                  Không có điểm đến phù hợp.
                </p>
              )}
            </div>
          </FilterSection>

          {/* =========================================
              LOẠI HÌNH LƯU TRÚ - THÊM MỚI
              ========================================= */}
          <FilterSection
            icon={<Building2 size={17} />}
            title="Loại hình lưu trú"
            initialOpen
            count={filters.hotelTypes.length}
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
          <FilterSection
            icon={<Star size={17} />}
            title="Hạng sao"
            count={filters.stars.length}
          >
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
          <FilterSection
            icon={<Wallet size={17} />}
            title="Khoảng giá / đêm (VND)"
            initialOpen
            count={
              Number(filters.minPrice !== "") + Number(filters.maxPrice !== "")
            }
          >
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
                  aria-label="Giá từ, VND"
                  placeholder="500000"
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
                  aria-label="Giá đến, VND"
                  placeholder="5000000"
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
          <FilterSection
            icon={<Star size={17} />}
            title="Đánh giá khách hàng"
            count={Number(filters.rating !== "")}
          >
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
                    checked={String(filters.rating) === String(item.value)}
                    onChange={() => updateFilter("rating", item.value)}
                    className="h-4 w-4 border-slate-300"
                  />

                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Bed */}
          <FilterSection
            icon={<BedDouble size={17} />}
            title="Loại giường"
            count={filters.bedTypes.length}
          >
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
          <FilterSection
            icon={<Sparkles size={17} />}
            title="Tiện nghi"
            count={filters.amenities.length}
          >
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
        <div className="sy-filter-footer">
          {priceError && (
            <p className="sy-filter-error" role="alert">
              {priceError}
            </p>
          )}
          <p aria-live="polite" className="sy-filter-selection">
            {count ? `${count} điều kiện đã chọn` : "Chưa chọn điều kiện lọc"}
          </p>
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
                Xóa tất cả
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

const FilterSection = ({ icon, title, children, count = 0 }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="sy-filter-section">
      <button
        type="button"
        className="sy-filter-section-title"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {icon && <span className="sy-filter-section-icon">{icon}</span>}
        <span>{title}</span>
        {count > 0 && <small>{count}</small>}
        <ChevronDown
          size={16}
          className={open ? "sy-filter-chevron-open" : ""}
        />
      </button>
      {open && <div className="sy-filter-section-body">{children}</div>}
    </section>
  );
};

const CheckboxItem = ({ label, checked, onChange, children }) => (
  <label className={`sy-filter-option ${checked ? "sy-filter-checked" : ""}`}>
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
