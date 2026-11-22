import express from "express";
import { getMe, updateMe } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../utils/userValidators.js";

const router = express.Router();

router.use(authenticate);

router.get("/me", getMe);
router.patch("/me", validate(updateProfileSchema), updateMe);

export default router;
