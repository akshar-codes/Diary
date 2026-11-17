import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { NoteService } from "./services/noteService";

async function bootstrap() {
  try {
    await connectDatabase(env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Trigger initial trash retention check & schedule periodic cleanup every 24h
    NoteService.purgeOldTrash(env.TRASH_RETENTION_DAYS).catch((err) =>
      console.error("Initial trash purge error:", err),
    );
    const trashCleanupInterval = setInterval(
      () => {
        NoteService.purgeOldTrash(env.TRASH_RETENTION_DAYS).catch((err) =>
          console.error("Scheduled trash purge error:", err),
        );
      },
      24 * 60 * 60 * 1000,
    );

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(
        `API Server running in ${env.NODE_ENV} mode on port ${env.PORT}`,
      );
      console.log(`Base URL: http://localhost:${env.PORT}/api/v1`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      clearInterval(trashCleanupInterval);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Bootstrap failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}
