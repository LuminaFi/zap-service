import { Router } from "express";
import spreadFeeController from "../controllers/spreadFeeController";
import { param, query } from "express-validator";
import { validate } from "../middleware/validator";

const router = Router();

/**
 * Validation rules for spread fee endpoints
 */
const validators = {
  calculateSpreadFee: [
    param("token").optional().isString().withMessage("Token must be a string"),

    query("days")
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage("Days must be an integer between 1 and 30"),
  ],

  getMarketVolatility: [
    query("tokens")
      .optional()
      .isString()
      .withMessage("Tokens must be a comma-separated string"),

    query("days")
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage("Days must be an integer between 1 and 30"),
  ],
};

/**
 * @route GET /api/spread-fee/:token
 * @desc Calculate spread fee for a specific token
 * @access Public
 */
router.get(
  "/spread-fee/:token?",
  validators.calculateSpreadFee,
  validate,
  spreadFeeController.calculateSpreadFee
);

/**
 * @route GET /api/market-volatility
 * @desc Get volatility for multiple tokens
 * @access Public
 */
router.get(
  "/market-volatility",
  validators.getMarketVolatility,
  validate,
  spreadFeeController.getMarketVolatility
);

/**
 * @route GET /api/average-spread-fee
 * @desc Calculate average volatility and recommended spread fee
 * @access Public
 */
router.get(
  "/average-spread-fee",
  validators.getMarketVolatility,
  validate,
  spreadFeeController.calculateAverageSpreadFee
);

export default router;
