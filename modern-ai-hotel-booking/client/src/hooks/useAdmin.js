import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { useToast } from "../components/admin/toastContext";

// Mỗi khối dữ liệu là một query riêng: khối nào lỗi thì chỉ khối đó báo lỗi
const q = (key, fn, opts = {}) => ({ queryKey: ["admin", key], queryFn: fn, ...opts });
const list = (key, fn, params) => ({ queryKey: ["admin", key, params], queryFn: () => fn(params), placeholderData: keepPreviousData });

export const useOverview = (p) => useQuery(list("overview", adminApi.overview, p));
export const useRevenue = (p) => useQuery(list("revenue", adminApi.revenue, p));
export const useBookingsByStatus = (p) => useQuery(list("by-status", adminApi.bookingsByStatus, p));
export const useTopHotels = (p) => useQuery(list("top-hotels", adminApi.topHotels, p));
export const useCustomerStats = (p) => useQuery(list("customers-stats", adminApi.customers, p));
export const useCancellation = (p) => useQuery(list("cancellation", adminApi.cancellation, p));
export const useAiInsights = () => useQuery(q("ai-insights", adminApi.aiInsights, { retry: false }));

export const useAdminUsers = (p) => useQuery(list("users", adminApi.users, p));
export const useAdminUser = (id) => useQuery({ queryKey: ["admin", "user", id], queryFn: () => adminApi.user(id), enabled: !!id });
export const useAdminHotels = (p) => useQuery(list("hotels", adminApi.hotels, p));
export const useAdminHotel = (id) => useQuery({ queryKey: ["admin", "hotel", id], queryFn: () => adminApi.hotel(id), enabled: !!id });
export const useAdminBookings = (p) => useQuery(list("bookings", adminApi.bookings, p));
export const useAdminBooking = (id) => useQuery({ queryKey: ["admin", "booking", id], queryFn: () => adminApi.booking(id), enabled: !!id });
export const useAuditLogs = (p) => useQuery(list("audit-logs", adminApi.auditLogs, p));

// Sau mọi thao tác ghi: làm mới toàn bộ dữ liệu admin (danh sách, đếm tab, dashboard) và báo thành công bằng toast.
// Lỗi không toast ở đây vì các modal xác nhận đã tự hiện lỗi ngay trong form.
export const useAdminMutation = (fn) => {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["admin"] }); if (res?.message) toast.success(res.message); },
  });
};
export const useAdminCoupons = (p) => useQuery(list("coupons", adminApi.coupons, p));
// Số khách sạn chờ duyệt cho badge ở sidebar (dùng chung cache với trang Khách sạn)
export const usePendingHotelCount = () =>
  useQuery({ queryKey: ["admin", "pending-hotels"], queryFn: () => adminApi.hotels({ status: "PENDING_APPROVAL", limit: 1 }), select: (r) => r.statusCounts?.PENDING_APPROVAL ?? 0, refetchInterval: 60_000 });

export const useSetUserStatus = () => useAdminMutation(adminApi.setUserStatus);
export const useApproveHotel = () => useAdminMutation(adminApi.approveHotel);
export const useRejectHotel = () => useAdminMutation(adminApi.rejectHotel);
export const useSetHotelStatus = () => useAdminMutation(adminApi.setHotelStatus);
export const useCancelBooking = () => useAdminMutation(adminApi.cancelBooking);
export const useCreateCoupon = () => useAdminMutation(adminApi.createCoupon);
export const useUpdateCoupon = () => useAdminMutation(adminApi.updateCoupon);
export const useSetCouponStatus = () => useAdminMutation(adminApi.setCouponStatus);
export const useDeleteCoupon = () => useAdminMutation(adminApi.deleteCoupon);