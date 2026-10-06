import express from "express";
import { authenticate } from "../middleware/auth.js";
import { recommendHotels, chat } from "../controllers/ai.controller.js";
const router = express.Router();
router.get("/recommendations", (req, res, next) => { if (req.headers.authorization) return authenticate(req, res, () => recommendHotels(req, res)); return recommendHotels(req, res); });
router.post("/chat", (req, res, next) => { if (req.headers.authorization) return authenticate(req, res, () => chat(req, res)); return chat(req, res); });
export default router;
