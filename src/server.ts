import createApp from "./app";
import config from "./config/config";

/**
 * Server entry point
 */
const startServer = async (): Promise<void> => {
  try {
    const app = createApp();
    const { port } = config.server;

    app.listen(port, () => {
      console.log(`Meta-transaction service running on port ${port}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received, shutting down gracefully");
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error("Unhandled error during startup:", error);
  process.exit(1);
});
