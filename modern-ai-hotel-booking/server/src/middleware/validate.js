// validate(schema): kiểm tra req.body bằng Zod; sai thì trả 400 kèm thông báo đầu tiên
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error.issues[0].message });
  }

  req.body = result.data;
  next();
};

// validateQuery(schema): kiểm tra req.query bằng Zod; kết quả để ở res.locals.query
// (Express 5 không cho gán lại req.query)
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error.issues[0].message });
  }

  res.locals.query = result.data;
  next();
};
