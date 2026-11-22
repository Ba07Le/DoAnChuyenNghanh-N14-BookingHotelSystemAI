import crypto from "node:crypto";
import EmailOtp from "../models/EmailOtp.js";
import { httpError } from "../utils/httpError.js";
import { sendOtpEmail } from "./mail.service.js";

const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;

// Thời gian hiệu lực của mã cũng là thời gian chờ trước khi được gửi mã mới
export const OTP_TTL_SECONDS = 60;

const generateCode = () => String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

// Gắn email vào hash để mã của email này không dùng được cho email khác
const hashCode = (email, code) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${email}:${code}`).digest("hex");

const isSameHash = (a, b) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
};

/**
 * Tạo mã mới và gửi qua email. Kết quả giống nhau dù email đã có tài khoản hay chưa.
 * Khi mã trước còn hiệu lực thì từ chối (429) và cho biết còn bao nhiêu giây.
 */
export const requestOtp = async (email) => {
  const active = await EmailOtp.findOne({ email, expiresAt: { $gt: new Date() } });

  if (active) {
    const retryAfter = Math.ceil((active.expiresAt.getTime() - Date.now()) / 1000);
    throw Object.assign(httpError(429, `Vui lòng đợi ${retryAfter} giây để yêu cầu mã mới.`), { retryAfter });
  }

  const code = generateCode();

  await EmailOtp.findOneAndUpdate(
    { email },
    {
      $set: {
        codeHash: hashCode(email, code),
        expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
        attempts: 0,
      },
    },
    { upsert: true },
  );

  try {
    await sendOtpEmail(email, code, OTP_TTL_SECONDS);
  } catch (error) {
    await EmailOtp.deleteOne({ email }); // gửi lỗi thì cho phép yêu cầu lại ngay
    throw error;
  }

  return { expiresIn: OTP_TTL_SECONDS };
};

/** Kiểm tra mã: dùng 1 lần, hết hạn sau OTP_TTL_SECONDS, sai tối đa MAX_ATTEMPTS lần. */
export const verifyOtp = async (email, code) => {
  // Tăng số lần thử ngay trong một thao tác nguyên tử để không thể dò mã bằng nhiều request song song
  const record = await EmailOtp.findOneAndUpdate(
    { email, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );

  if (!record) {
    throw httpError(400, "Mã không hợp lệ, đã hết hạn hoặc nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.");
  }

  if (!isSameHash(hashCode(email, code), record.codeHash)) {
    const attemptsLeft = MAX_ATTEMPTS - record.attempts;
    throw httpError(
      400,
      attemptsLeft > 0
        ? `Mã không đúng. Bạn còn ${attemptsLeft} lần thử.`
        : "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.",
    );
  }

  await EmailOtp.deleteOne({ _id: record._id });
};
