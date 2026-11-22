const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// validateObjectId("hotelId"): chặn id sai định dạng trước khi truy vấn database
export const validateObjectId = (paramName) => (req, res, next) => {
  if (!OBJECT_ID_PATTERN.test(req.params[paramName])) {
    return res.status(400).json({ success: false, message: "Mã không hợp lệ." });
  }

  next();
};
