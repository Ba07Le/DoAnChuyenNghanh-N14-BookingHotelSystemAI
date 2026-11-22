import jwt from "jsonwebtoken";

const TOKEN_EXPIRES_IN = "7d";

// tokenVersion: tăng lên để vô hiệu hoá mọi token cũ của người dùng
export const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN },
  );

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
