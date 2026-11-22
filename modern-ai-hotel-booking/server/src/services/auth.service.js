import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import User from "../models/User.js";
import { httpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { verifyOtp } from "./otp.service.js";
import { verifyFacebookToken, verifyGoogleCredential } from "./socialProvider.service.js";

const PROVIDER_FIELD = { google: "googleId", facebook: "facebookId" };
const STAFF_ROLES = ["ADMIN", "HOTEL_OWNER"];
const BCRYPT_ROUNDS = 12;

// Giữ nguyên dạng dữ liệu người dùng mà client đang dùng
const toPublicUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  status: user.status,
});

const createSession = (user) => ({ token: signToken(user), user: toPublicUser(user) });

const assertActive = (user) => {
  if (user.status !== "ACTIVE") throw httpError(403, "Tài khoản hiện không thể đăng nhập.");
};

const normalizeName = (name) => {
  const clean = (name || "").trim().slice(0, 100);
  return clean.length >= 2 ? clean : "Người dùng";
};

const nameFromEmail = (email) => normalizeName(email.split("@")[0].replace(/[._+-]+/g, " "));

// tokenVersion bị ẩn mặc định nên phải chọn rõ khi cần ký token hoặc tăng phiên bản
const findUser = (filter) => User.findOne(filter).select("+tokenVersion");

// Đăng xuất mọi thiết bị: token cũ có tokenVersion thấp hơn sẽ bị từ chối
const revokeOldTokens = (user) => {
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
};

const completeLogin = async (user) => {
  assertActive(user);
  user.lastLoginAt = new Date();
  await user.save();
  return createSession(user);
};

// Mật khẩu giả để vẫn tốn thời gian so sánh khi không có tài khoản, tránh lộ email nào tồn tại
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash(crypto.randomUUID(), BCRYPT_ROUNDS));

/**
 * Đăng nhập bằng email và mật khẩu, chỉ dành cho ADMIN và HOTEL_OWNER.
 * Mọi trường hợp sai (không có tài khoản, không phải tài khoản quản trị, chưa có mật khẩu,
 * sai mật khẩu) đều trả cùng một thông báo.
 */
export const loginStaff = async (email, password) => {
  const user = await findUser({ email }).select("+passwordHash");
  const isStaff = Boolean(user && STAFF_ROLES.includes(user.role) && user.passwordHash);

  const passwordMatches = await bcrypt.compare(password, isStaff ? user.passwordHash : await getDummyHash());
  if (!isStaff || !passwordMatches) throw httpError(401, "Email hoặc mật khẩu không chính xác.");

  return completeLogin(user);
};

/**
 * Đăng nhập bằng mã OTP gửi qua email. Nhập đúng mã nghĩa là chứng minh sở hữu email:
 * - Email chưa có tài khoản: tạo tài khoản CUSTOMER (đã xác minh email).
 * - Đã có tài khoản: đăng nhập.
 * - Tài khoản có sẵn chưa xác minh email (tạo từ Facebook): xác minh, gỡ liên kết Facebook cũ
 *   và vô hiệu token cũ để người dùng email của người khác không giữ được quyền truy cập.
 */
export const loginWithEmailOtp = async (email, code) => {
  await verifyOtp(email, code);

  let user = await findUser({ email });

  if (!user) {
    user = new User({ fullName: nameFromEmail(email), email, emailVerified: true });
  } else if (!user.emailVerified) {
    user.facebookId = undefined;
    user.emailVerified = true;
    revokeOldTokens(user);
  }

  return completeLogin(user);
};

/**
 * Đăng nhập / tạo tài khoản bằng Google hoặc Facebook:
 * 1) Đã liên kết nhà cung cấp này: đăng nhập.
 * 2) Chưa liên kết nhưng trùng email với tài khoản có sẵn:
 *    - Google (email đã xác minh): liên kết. Nếu tài khoản có sẵn chưa xác minh email (tạo từ Facebook)
 *      thì gỡ liên kết Facebook cũ và vô hiệu token cũ.
 *    - Facebook: chỉ liên kết khi tài khoản có sẵn đã xác minh email, nếu không trả 409.
 * 3) Chưa có tài khoản: tạo mới.
 */
const loginWithSocial = async (provider, profile) => {
  const idField = PROVIDER_FIELD[provider];
  let user = await findUser({ [idField]: profile.providerId });

  if (!user) {
    if (!profile.email) {
      throw httpError(
        400,
        provider === "google"
          ? "Tài khoản Google không có email."
          : "Facebook không cung cấp email. Vui lòng cho phép chia sẻ email hoặc đăng nhập bằng mã gửi qua email.",
      );
    }

    if (provider === "google" && !profile.emailVerified) {
      throw httpError(400, "Email Google chưa được xác minh nên không thể đăng nhập.");
    }

    const existing = await findUser({ email: profile.email });

    if (existing) {
      if (existing[idField]) {
        throw httpError(409, "Email này đã liên kết với một tài khoản mạng xã hội khác.");
      }

      if (provider === "facebook" && !existing.emailVerified) {
        throw httpError(409, "Email này đã có tài khoản. Vui lòng đăng nhập bằng mã gửi qua email hoặc Google.");
      }

      if (provider === "google" && !existing.emailVerified) {
        existing.facebookId = undefined;
        existing.emailVerified = true;
        revokeOldTokens(existing);
      }

      existing[idField] = profile.providerId;
      existing.avatar ||= profile.avatar;
      user = existing;
    } else {
      user = new User({
        fullName: normalizeName(profile.fullName),
        email: profile.email,
        [idField]: profile.providerId,
        avatar: profile.avatar,
        emailVerified: provider === "google",
      });
    }
  }

  return completeLogin(user);
};

export const loginWithGoogle = async (credential) =>
  loginWithSocial("google", await verifyGoogleCredential(credential));

export const loginWithFacebook = async (accessToken) =>
  loginWithSocial("facebook", await verifyFacebookToken(accessToken));
