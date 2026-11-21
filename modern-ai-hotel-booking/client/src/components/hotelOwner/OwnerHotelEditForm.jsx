
import { useState } from "react";

export default function OwnerHotelEditForm({
  hotel,
  saving,
  onSave,
  onCancel
}) {
  // Khởi tạo dữ liệu từ khách sạn đang chọn
  const [form, setForm] = useState(() => ({
    name: hotel.name || "",
    description: hotel.description || "",
    starRating: hotel.starRating || 3,
    phone: hotel.contact?.phone || "",
    email: hotel.contact?.email || ""
  }));

  // Cập nhật dữ liệu khi người dùng nhập
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Gửi thông tin chỉnh sửa về component cha
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    onSave(hotel._id, {
      name: form.name.trim(),
      description: form.description.trim(),
      starRating: Number(form.starRating),
      contact: {
        ...(hotel.contact || {}),
        phone: form.phone.trim(),
        email: form.email.trim()
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-4 rounded-xl border bg-white p-5"
    >
      <h3 className="text-xl font-bold">
        Chỉnh sửa khách sạn
      </h3>

      {/* Tên khách sạn */}
      <label className="grid gap-2">
        Tên khách sạn
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="rounded-lg border p-3"
        />
      </label>

      {/* Mô tả */}
      <label className="grid gap-2">
        Mô tả khách sạn
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="rounded-lg border p-3"
        />
      </label>

      {/* Số sao */}
      <label className="grid gap-2">
        Số sao
        <select
          name="starRating"
          value={form.starRating}
          onChange={handleChange}
          className="rounded-lg border p-3"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <option key={star} value={star}>
              {star} sao
            </option>
          ))}
        </select>
      </label>

      {/* Số điện thoại */}
      <label className="grid gap-2">
        Số điện thoại
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          className="rounded-lg border p-3"
        />
      </label>

      {/* Email */}
      <label className="grid gap-2">
        Email liên hệ
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="rounded-lg border p-3"
        />
      </label>

      {/* Nút điều khiển */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border px-5 py-2"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
