
import OwnerHotelCard from "./OwnerHotelCard";

export default function OwnerHotelList({
  hotels,
  loading,
  onEdit,
  onDelete
}) {
  // Hiển thị trạng thái đang tải dữ liệu
  if (loading) {
    return (
      <p className="mt-6 text-slate-500">
        Đang tải danh sách khách sạn...
      </p>
    );
  }

  // Hiển thị khi chưa có khách sạn
  if (!hotels || hotels.length === 0) {
    return (
      <div className="mt-6 rounded-lg border p-6 text-center">
        <p className="text-slate-500">
          Bạn chưa có khách sạn nào.
        </p>
      </div>
    );
  }

  // Hiển thị danh sách khách sạn
  return (
    <div className="mt-6">
      <h3 className="mb-4 text-lg font-semibold">
        Danh sách khách sạn ({hotels.length})
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {hotels.map((hotel) => (
          <OwnerHotelCard
            key={hotel._id}
            hotel={hotel}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
