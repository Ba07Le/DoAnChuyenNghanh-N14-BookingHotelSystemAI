import { Router } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { chat } from "../services/chatService.js";

const router = Router();

// protects the OpenAI bill: 15 requests per minute per IP
const chatLimiter = rateLimit({ windowMs: 60_000, max: 15 });

// Guests allowed: a valid token adds the user, anything else is treated as a guest
const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.userId).select("_id status").lean();
      if (user?.status === "ACTIVE") req.user = user;
    }
  } catch {
    // invalid or expired token: continue as guest
  }
  next();
};

router.post("/", chatLimiter, optionalAuth, async (req, res) => {
  try {
    const history = (req.body.messages || [])
      .filter((m) => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }))
      .slice(-10);
    const reply = await chat(history, req.user?._id);
    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;