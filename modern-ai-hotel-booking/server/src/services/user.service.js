import User from "../models/User.js";
import { httpError } from "../utils/httpError.js";

const toProfile = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  status: user.status,
  emailVerified: user.emailVerified,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  nationality: user.nationality,
  address: user.address,
});

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw httpError(404, "Không tìm thấy người dùng.");

  return toProfile(user);
};

export const updateProfile = async (userId, data) => {
  const { dateOfBirth, ...changes } = data;

  // Chuỗi rỗng nghĩa là xoá ngày sinh
  if (dateOfBirth !== undefined) {
    changes.dateOfBirth = dateOfBirth === "" ? null : new Date(dateOfBirth);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: changes },
    { returnDocument: "after", runValidators: true },
  );
  if (!user) throw httpError(404, "Không tìm thấy người dùng.");

  return toProfile(user);
};
