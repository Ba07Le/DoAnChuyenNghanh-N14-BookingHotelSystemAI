import { Link } from "react-router-dom";

const inputClass = "mt-2 block w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400";

function Field({ label, error, className = "", children }) {
  return (
    <div className={className}>
      <label
        className={`block rounded-2xl bg-slate-50 p-5 text-sm font-medium text-slate-700 ${
          error ? "ring-2 ring-red-300" : ""
        }`}
      >
        {label}
        {children}
      </label>

      {error && <p className="mt-1.5 px-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Thông tin người nhận phòng.
 * Khách đã đăng nhập: được điền sẵn từ hồ sơ. Khách vãng lai: tự nhập, không cần tài khoản.
 */
function GuestForm({ contact, errors, isCustomer, onChange }) {
  const handleChange = (e) => onChange(e.target.name, e.target.value);

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">Thông tin người nhận phòng</h2>

      <p className="mt-1 text-sm text-slate-500">
        {isCustomer ? (
          <>
            Thông tin được cá nhân nhận phòng của bạn. Vui lòng chỉnh sửa nếu bạn đặt giúp người khác.{" "}
            <Link to="/profile" target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
              Cập nhật hồ sơ
            </Link>
          </>
        ) : (
          "Nhập thông tin để nhận xác nhận đặt phòng. Bạn không cần tạo tài khoản."
        )}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Họ và tên" error={errors.fullName} className="sm:col-span-2">
          <input
            name="fullName"
            value={contact.fullName}
            onChange={handleChange}
            maxLength={100}
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            className={inputClass}
          />
        </Field>

        <Field label="Số điện thoại" error={errors.phone}>
          <input
            name="phone"
            type="tel"
            value={contact.phone}
            onChange={handleChange}
            autoComplete="tel"
            placeholder=""
            className={inputClass}
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            name="email"
            type="email"
            value={contact.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder=""
            className={inputClass}
          />
        </Field>

        <Field label="Ghi chú cho khách sạn (không bắt buộc)" className="sm:col-span-2">
          <textarea
            name="note"
            value={contact.note}
            onChange={handleChange}
            maxLength={500}
            rows={3}
            placeholder="Ví dụ: phòng tầng cao, nhận phòng muộn..."
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>
    </section>
  );
}

export default GuestForm;
