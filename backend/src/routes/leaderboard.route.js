import { Router } from "express";
import { getGlobalLeaderboard } from "../controllers/leaderboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/leaderboard/global",
  authenticate,
  getGlobalLeaderboard
);

export default router;
