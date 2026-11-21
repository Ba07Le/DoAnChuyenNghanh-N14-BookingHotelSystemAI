
export default function OwnerHotelCard({
  hotel,
  onEdit,
  onDelete
}) {
  // Chuyển trạng thái khách sạn sang tiếng Việt
  const statusLabels = {
    DRAFT: "Bản nháp",
    PENDING_APPROVAL: "Chờ phê duyệt",
    APPROVED: "Đã phê duyệt",
    REJECTED: "Bị từ chối",
    SUSPENDED: "Tạm ngưng"
  };

  const statusText =
    statusLabels[hotel.status] ||
    hotel.status ||
    "Chưa xác định";

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">

      {/* Tên khách sạn */}
      <h3 className="text-lg font-bold">
        {hotel.name}
      </h3>

      {/* Thông tin khách sạn */}
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <p>
          <strong>Thành phố:</strong>{" "}
          {hotel.address?.city || "Chưa có"}
        </p>

        <p>
          <strong>Số sao:</strong>{" "}
          {hotel.starRating || "Chưa có"}
        </p>

        <p>
          <strong>Trạng thái:</strong>{" "}
          {statusText}
        </p>
      </div>

      {/* Các nút quản lý khách sạn */}
      <div className="mt-4 flex flex-wrap gap-3">

        {/* Nút chỉnh sửa */}
        <button
          type="button"
          onClick={() => onEdit(hotel)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sửa khách sạn
        </button>

        {/* Nút xóa */}
        <button
          type="button"
          onClick={() => onDelete(hotel)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Xóa khách sạn
        </button>

      </div>
    </div>
  );
}
