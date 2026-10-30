
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import quizRoutes from "./routes/quiz.route.js";
import attemptRoutes from "./routes/attempt.route.js";
import leaderboardRoutes from "./routes/leaderboard.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Quiz platform API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api", attemptRoutes);
app.use("/api", leaderboardRoutes);

// Central error handler: keep this after all routes.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Database validation failed",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data format",
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
