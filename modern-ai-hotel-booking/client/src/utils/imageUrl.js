/**
 * Chuẩn hoá đường dẫn hình ảnh:
 * - Nếu là URL đầy đủ (http://, https://) hoặc blob:/data:, giữ nguyên.
 * - Nếu là đường dẫn tương đối (/uploads/...), tự động nối với host của server backend.
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const backendHost =
    (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

  return `${backendHost}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};
