import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMe } from "../api/authApi";
import { updateProfile } from "../api/profileApi";
import { useAuth } from "../context/AuthContext";

const GENDER_OPTIONS = [
  { value: "", label: "Chưa chọn" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

// Danh sách mã quốc gia chuẩn ISO 3166-1 alpha-2 của toàn thế giới
const COUNTRY_CODES = [
  "AF",
  "AL",
  "DZ",
  "AD",
  "AO",
  "AG",
  "AR",
  "AM",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BH",
  "BD",
  "BB",
  "BY",
  "BE",
  "BZ",
  "BJ",
  "BT",
  "BO",
  "BA",
  "BW",
  "BR",
  "BN",
  "BG",
  "BF",
  "BI",
  "CV",
  "KH",
  "CM",
  "CA",
  "CF",
  "TD",
  "CL",
  "CN",
  "CO",
  "KM",
  "CG",
  "CD",
  "CR",
  "CI",
  "HR",
  "CU",
  "CY",
  "CZ",
  "DK",
  "DJ",
  "DM",
  "DO",
  "EC",
  "EG",
  "SV",
  "GQ",
  "ER",
  "EE",
  "SZ",
  "ET",
  "FJ",
  "FI",
  "FR",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GR",
  "GD",
  "GT",
  "GN",
  "GW",
  "GY",
  "HT",
  "HN",
  "HK",
  "HU",
  "IS",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IE",
  "IL",
  "IT",
  "JM",
  "JP",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KP",
  "KR",
  "KW",
  "KG",
  "LA",
  "LV",
  "LB",
  "LS",
  "LR",
  "LY",
  "LI",
  "LT",
  "LU",
  "MO",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MR",
  "MU",
  "MX",
  "FM",
  "MD",
  "MC",
  "MN",
  "ME",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NZ",
  "NI",
  "NE",
  "NG",
  "MK",
  "NO",
  "OM",
  "PK",
  "PW",
  "PS",
  "PA",
  "PG",
  "PY",
  "PE",
  "PH",
  "PL",
  "PT",
  "QA",
  "RO",
  "RU",
  "RW",
  "KN",
  "LC",
  "VC",
  "WS",
  "SM",
  "ST",
  "SA",
  "SN",
  "RS",
  "SC",
  "SL",
  "SG",
  "SK",
  "SI",
  "SB",
  "SO",
  "ZA",
  "SS",
  "ES",
  "LK",
  "SD",
  "SR",
  "SE",
  "CH",
  "SY",
  "TW",
  "TJ",
  "TZ",
  "TH",
  "TL",
  "TG",
  "TO",
  "TT",
  "TN",
  "TR",
  "TM",
  "TV",
  "UG",
  "UA",
  "AE",
  "GB",
  "US",
  "UY",
  "UZ",
  "VU",
  "VA",
  "VE",
  "VN",
  "YE",
  "ZM",
  "ZW",
];

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const today = new Date().toISOString().slice(0, 10);

const toForm = (profile) => ({
  fullName: profile.fullName || "",
  phone: profile.phone || "",
  dateOfBirth: profile.dateOfBirth
    ? String(profile.dateOfBirth).slice(0, 10)
    : "",
  gender: profile.gender || "",
  nationality: profile.nationality || "",
  address: profile.address || "",
});

function Field({ label, className = "", children }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function Profile() {
  const { user, token, login } = useAuth();

  const [profile, setProfile] = useState(user ?? {});
  const [form, setForm] = useState(() => toForm(user ?? {}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openCountry, setOpenCountry] = useState(false);
  const countryRef = useRef(null);

  // Tự động lấy tên tiếng Việt & tiếng Anh của toàn bộ quốc gia bằng Intl.DisplayNames có sẵn
  const countries = useMemo(() => {
    const viNames = new Intl.DisplayNames(["vi"], { type: "region" });
    const enNames = new Intl.DisplayNames(["en"], { type: "region" });

    const list = COUNTRY_CODES.map((code) => {
      const label = viNames.of(code) || code;
      const enName = enNames.of(code) || code;

      return {
        code,
        label,
        enName,
        searchTerms: `${label} ${enName} ${code}`.toLowerCase(),
      };
    });

    // Đưa Việt Nam lên đầu, các nước còn lại xếp theo bảng chữ cái tiếng Việt
    return list.sort((a, b) => {
      if (a.code === "VN") return -1;
      if (b.code === "VN") return 1;
      return a.label.localeCompare(b.label, "vi");
    });
  }, []);

  useEffect(() => {
    getMe()
      .then((data) => {
        const currentUser = data.user ?? data;
        if (!currentUser || !currentUser.email)
          throw new Error("Không có dữ liệu hồ sơ.");
        setProfile(currentUser);
        setForm(toForm(currentUser));
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            "Không tải được hồ sơ. Vui lòng thử lại.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setOpenCountry(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSelectCountry = (countryLabel) => {
    setForm((prev) => ({ ...prev, nationality: countryLabel }));
    setOpenCountry(false);
    setError("");
    setSuccess("");
  };

  const keyword = form.nationality.trim().toLowerCase();
  const matchedCountry = countries.find(
    (c) =>
      c.label.toLowerCase() === keyword || c.enName.toLowerCase() === keyword,
  );

  const filteredCountries =
    !keyword || matchedCountry
      ? countries
      : countries.filter((c) => c.searchTerms.includes(keyword));

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedNationality = form.nationality.trim();
    if (trimmedNationality && !matchedCountry) {
      setError(
        "Quốc tịch không hợp lệ. Vui lòng chọn một quốc gia trong danh sách.",
      );
      setOpenCountry(true);
      return;
    }

    const payload = {
      ...form,
      nationality: matchedCountry ? matchedCountry.label : "",
    };

    try {
      setSaving(true);

      const data = await updateProfile(payload);
      const updatedUser = data.user ?? data;
      if (!updatedUser || !updatedUser.email)
        throw new Error("API không trả về hồ sơ hợp lệ.");
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");

      login({ token, user: updatedUser });
      setProfile(updatedUser);
      setForm(toForm(updatedUser));
      setSuccess(data.message || "Đã lưu thay đổi.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể lưu thay đổi. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const initial = (profile.fullName || profile.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      {loading && (
        <p className="mb-4 text-sm text-slate-500">Đang tải hồ sơ...</p>
      )}
      <h1 className="text-3xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
      <p className="mt-2 text-sm text-slate-500">
        Cập nhật thông tin tài khoản của bạn.
      </p>

      <div className="mt-8 flex items-center gap-4">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.fullName}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-3xl font-bold text-blue-600">
            {initial}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-900">
            {profile.fullName}
          </p>
          <p className="truncate text-sm text-slate-500">{profile.email}</p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Họ và tên">
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            maxLength={100}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Email">
          <div className="relative">
            <input
              value={profile.email || ""}
              disabled
              className={`${inputClass} bg-slate-50 pr-28 text-slate-500`}
            />

            {profile.emailVerified && (
              <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                Đã xác minh
              </span>
            )}
          </div>
        </Field>

        <Field label="Số điện thoại">
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder=""
            className={inputClass}
          />
        </Field>

        <Field label="Ngày sinh">
          <input
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange}
            max={today}
            className={inputClass}
          />
        </Field>

        <Field label="Giới tính">
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className={inputClass}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Quốc tịch: Tự động dịch tiếng Việt toàn bộ quốc gia */}
        <div ref={countryRef} className="relative">
          <Field label="Quốc tịch">
            <div className="relative">
              <input
                name="nationality"
                value={form.nationality}
                onFocus={() => setOpenCountry(true)}
                onChange={(e) => {
                  handleChange(e);
                  setOpenCountry(true);
                }}
                maxLength={100}
                autoComplete="off"
                placeholder="Chọn hoặc nhập quốc gia"
                className={`${inputClass} pr-10`}
              />

              <button
                type="button"
                tabIndex={-1}
                onClick={() => setOpenCountry((prev) => !prev)}
                aria-label="Mở danh sách quốc gia"
                className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    openCountry ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </Field>

          {openCountry && (
            <ul className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => {
                  const isSelected =
                    form.nationality.trim().toLowerCase() ===
                    country.label.toLowerCase();

                  return (
                    <li key={country.code}>
                      <button
                        type="button"
                        onClick={() => handleSelectCountry(country.label)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? "bg-blue-50 font-semibold text-blue-600"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{country.label}</span>
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-2.5 text-sm text-slate-400">
                  Không tìm thấy quốc gia phù hợp
                </li>
              )}
            </ul>
          )}
        </div>

        <Field label="Địa chỉ" className="sm:col-span-2">
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            maxLength={255}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
            className={inputClass}
          />
        </Field>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
