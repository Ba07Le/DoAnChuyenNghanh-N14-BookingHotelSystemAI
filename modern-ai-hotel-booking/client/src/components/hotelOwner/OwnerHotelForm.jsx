
export default function OwnerHotelForm({
  form,
  hotelTypes,
  destinations,
  saving,
  onChange,
  onSubmit
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 grid gap-4 rounded-lg border bg-white p-5"
    >
      <h3 className="text-lg font-semibold">
        Thêm khách sạn mới
      </h3>

      {/* Tên khách sạn */}
      <input
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="Tên khách sạn"
        required
        className="rounded-lg border p-3"
      />

      {/* Đường dẫn khách sạn */}
      <input
        name="slug"
        value={form.slug}
        onChange={onChange}
        placeholder="Slug (ví dụ: khach-san-abc)"
        required
        className="rounded-lg border p-3"
      />

      {/* Mô tả khách sạn */}
      <textarea
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Mô tả khách sạn"
        className="rounded-lg border p-3"
      />

      {/* Chọn loại khách sạn */}
      <select
        name="hotelTypeId"
        value={form.hotelTypeId}
        onChange={onChange}
        required
        className="rounded-lg border p-3"
      >
        <option value="">
          Chọn loại khách sạn
        </option>

        {hotelTypes.map((type) => (
          <option
            key={type._id}
            value={type._id}
          >
            {type.name}
          </option>
        ))}
      </select>

      {/* Chọn địa điểm */}
      <select
        name="destinationId"
        value={form.destinationId}
        onChange={onChange}
        required
        className="rounded-lg border p-3"
      >
        <option value="">
          Chọn địa điểm
        </option>

        {destinations.map((destination) => (
          <option
            key={destination._id}
            value={destination._id}
          >
            {destination.name}
          </option>
        ))}
      </select>

      {/* Số sao khách sạn */}
      <label className="grid gap-2">
        Số sao

        <select
          name="starRating"
          value={form.starRating}
          onChange={onChange}
          className="rounded-lg border p-3"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <option
              key={star}
              value={star}
            >
              {star} sao
            </option>
          ))}
        </select>
      </label>

      {/* Thành phố */}
      <input
        name="city"
        value={form.city}
        onChange={onChange}
        placeholder="Thành phố"
        required
        className="rounded-lg border p-3"
      />

      {/* Kinh độ */}
      <input
        name="longitude"
        type="number"
        step="any"
        value={form.longitude}
        onChange={onChange}
        placeholder="Kinh độ (Longitude)"
        required
        className="rounded-lg border p-3"
      />

      {/* Vĩ độ */}
      <input
        name="latitude"
        type="number"
        step="any"
        value={form.latitude}
        onChange={onChange}
        placeholder="Vĩ độ (Latitude)"
        required
        className="rounded-lg border p-3"
      />

      {/* Nút lưu */}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Lưu khách sạn"}
      </button>
    </form>
  );
}
