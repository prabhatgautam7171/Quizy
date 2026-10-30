
import express from "express";

import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  publishQuiz,
  deleteQuiz,
} from "../controllers/quiz.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// All quiz routes require authentication.
router.use(authenticate);

// List and create
router.get("/", getQuizzes);
router.post("/", authorize("TEACHER"), createQuiz);

// Publish must be registered before the general ID routes for clarity.
router.patch(
  "/:id/publish",
  authorize("TEACHER"),
  publishQuiz
);

// Read, update and delete
router.get("/:id", getQuizById);
router.patch("/:id", authorize("TEACHER"), updateQuiz);
router.delete("/:id", authorize("TEACHER"), deleteQuiz);

export default router;
