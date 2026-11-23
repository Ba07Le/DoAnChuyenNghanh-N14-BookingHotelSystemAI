/**
 * Middleware kiểm tra dữ liệu bằng Zod.
 *
 * Hỗ trợ:
 * - validate(schema): kiểm tra req.body
 * - validate(schema, "body")
 * - validate(schema, "query")
 * - validate(schema, "params")
 * - validateQuery(schema): giữ tương thích API cũ
 *
 * Dữ liệu hợp lệ được lưu trong req.valid.
 * Riêng query được lưu thêm vào res.locals.query.
 */

// ===============================
// TRẢ VỀ LỖI VALIDATION
// ===============================
const validationError = (res, issues) => {
  return res.status(400).json({
    success: false,
    message: issues[0]?.message || "Dữ liệu không hợp lệ.",
    errors: issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
};

// ===============================
// VALIDATE BODY / QUERY / PARAMS
// ===============================
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    // Chỉ chấp nhận nguồn dữ liệu hợp lệ
    if (!["body", "query", "params"].includes(source)) {
      return next(new Error(`Nguồn validation không hợp lệ: ${source}`));
    }

    const input = source === "body" ? (req.body ?? {}) : req[source];

    const result = schema.safeParse(input);

    if (!result.success) {
      return validationError(res, result.error.issues);
    }

    // Lưu dữ liệu đã validate cho Admin
    req.valid = {
      ...(req.valid || {}),
      [source]: result.data,
    };

    // Giữ tương thích với các API hiện tại
    if (source === "body") {
      req.body = result.data;
    }

    // Express 5: không gán lại req.query
    if (source === "query") {
      res.locals.query = result.data;
    }

    next();
  };
};

// ===============================
// VALIDATE QUERY - API HIỆN TẠI
// ===============================
export const validateQuery = (schema) => {
  return validate(schema, "query");
};
