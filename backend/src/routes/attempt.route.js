
import express from "express";
import {
  startAttempt,
  getAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getLeaderboard,
} from "../controllers/attempt.controller.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Students start and manage their own attempts.
router.post(
  "/quizzes/:id/start",
  authorize("STUDENT"),
  startAttempt
);

router.get(
  "/attempts/:id",
  authorize("STUDENT"),
  getAttempt
);

router.put(
  "/attempts/:id/answers",
  authorize("STUDENT"),
  saveAnswer
);

router.post(
  "/attempts/:id/submit",
  authorize("STUDENT"),
  submitAttempt
);

router.get(
  "/attempts/:id/result",
  authorize("STUDENT"),
  getAttemptResult
);

// Authenticated users can view a published quiz leaderboard.
router.get(
  "/quizzes/:id/leaderboard",
  getLeaderboard
);

export default router;
