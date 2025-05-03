import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { initializeBlockchain } from "./utils/blockchain";
import config from "./config/config";
import { setupSwagger } from "./swagger";

/**
 * Express app setup
 */
const createApp = (): Express => {
  config.validateConfig();

  initializeBlockchain();

  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Initialize API routes
  app.use(routes);

  // Setup Swagger documentation
  setupSwagger(app);

  app.use(errorHandler);

  return app;
};

export default createApp;
