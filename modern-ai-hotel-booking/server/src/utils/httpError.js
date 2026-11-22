// Tạo lỗi kèm mã HTTP; error handler trong server.js sẽ đọc err.status
export const httpError = (status, message) => Object.assign(new Error(message), { status });
