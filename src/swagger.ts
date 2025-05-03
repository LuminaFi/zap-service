import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

/**
 * Configure Swagger documentation for the API
 * @param app Express application
 */
export const setupSwagger = (app: express.Express): void => {
  try {
    // Load the Swagger document
    const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));

    // Serve Swagger UI
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // Serve the raw OpenAPI spec
    app.get("/api-spec", (req, res) => {
      res.setHeader("Content-Type", "application/yaml");
      res.sendFile(path.join(__dirname, "../swagger.yaml"));
    });

    console.log("Swagger documentation initialized at /api-docs");
  } catch (error) {
    console.error("Failed to initialize Swagger documentation:", error);
  }
};
