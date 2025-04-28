import { Request, Response, NextFunction } from "express";
import { ServiceError } from "../types";

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`Error: ${err.message}`);

  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Default to 500 server error for unhandled errors
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};
