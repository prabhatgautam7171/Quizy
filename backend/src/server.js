
import app from "./app.js";
import connectDB from "./config/db.js";

import { expireDueAttempts } from "./controllers/attempt.controller.js";

const PORT = process.env.PORT || 8000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Server-side expiry check; browser timers are not authoritative.
  const expiryJob = setInterval(() => {
    expireDueAttempts().catch((error) => {
      console.error("Attempt expiry job failed:", error);
    });
  }, 15_000);

  expiryJob.unref();
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
