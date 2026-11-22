import * as userService from "../services/user.service.js";

// Controller chỉ nhận request và trả response; nghiệp vụ nằm trong services/user.service.js

export const getMe = async (req, res) => {
  const user = await userService.getProfile(req.user._id);

  res.json({ success: true, user });
};

export const updateMe = async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);

  res.json({ success: true, message: "Đã lưu thay đổi.", user });
};
