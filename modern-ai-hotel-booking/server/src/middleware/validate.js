// Express 5: req.query là getter chỉ đọc, nên kết quả đã validate được lưu vào req.valid
export const validate = (schema, source = "query") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0]?.message || "Dữ liệu không hợp lệ.",
      errors: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  req.valid = { ...(req.valid || {}), [source]: result.data };
  next();
};
