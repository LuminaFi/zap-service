import { Router } from "express";
import tokenFeeController from "../controllers/tokenFeeController";
import { param, query } from "express-validator";
import { validate } from "../middleware/validator";

const router = Router();

/**
 * Validation rules for token fee endpoints
 */
const validators = {
  getTokenPrice: [
    param("token").optional().isString().withMessage("Token must be a string"),
  ],

  calculateFees: [
    query("token").optional().isString().withMessage("Token must be a string"),

    query("amount")
      .isFloat({ min: 0.000001 })
      .withMessage("Amount must be a positive number"),

    query("customSpreadFee")
      .optional()
      .isFloat({ min: 0, max: 0.1 })
      .withMessage("Custom spread fee must be between 0 and 0.1 (0-10%)"),
  ],

  calculateIdrxAmount: [
    query("token").optional().isString().withMessage("Token must be a string"),

    query("amount")
      .isFloat({ min: 0.000001 })
      .withMessage("Amount must be a positive number"),

    query("customSpreadFee")
      .optional()
      .isFloat({ min: 0, max: 0.1 })
      .withMessage("Custom spread fee must be between 0 and 0.1 (0-10%)"),
  ],

  calculateSourceAmount: [
    query("token").optional().isString().withMessage("Token must be a string"),

    query("idrxAmount")
      .isFloat({ min: 1 })
      .withMessage("IDRX amount must be a positive number greater than 1"),

    query("customSpreadFee")
      .optional()
      .isFloat({ min: 0, max: 0.1 })
      .withMessage("Custom spread fee must be between 0 and 0.1 (0-10%)"),
  ],

  calculateVolatility: [
    param("token").optional().isString().withMessage("Token must be a string"),

    query("days")
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage("Days must be an integer between 1 and 30"),
  ],
};

/**
 * @route GET /api/token-price/:token
 * @desc Get token price data
 * @access Public
 */
router.get(
  "/token-price/:token?",
  validators.getTokenPrice,
  validate,
  tokenFeeController.getTokenPrice
);

/**
 * @route GET /api/calculate-fees
 * @desc Calculate fees for a token amount
 * @access Public
 */
router.get(
  "/calculate-fees",
  validators.calculateFees,
  validate,
  tokenFeeController.calculateFees
);

/**
 * @route GET /api/calculate-idrx
 * @desc Calculate IDRX amount from source token
 * @access Public
 */
router.get(
  "/calculate-idrx",
  validators.calculateIdrxAmount,
  validate,
  tokenFeeController.calculateIdrxAmount
);

/**
 * @route GET /api/calculate-source
 * @desc Calculate source token amount needed for a desired IDRX amount
 * @access Public
 */
router.get(
  "/calculate-source",
  validators.calculateSourceAmount,
  validate,
  tokenFeeController.calculateSourceAmount
);

/**
 * @route GET /api/volatility/:token
 * @desc Calculate volatility and recommended spread fee
 * @access Public
 */
router.get(
  "/volatility/:token?",
  validators.calculateVolatility,
  validate,
  tokenFeeController.calculateVolatility
);

/**
 * @route GET /api/supported-tokens
 * @desc Get list of supported tokens
 * @access Public
 */
router.get("/supported-tokens", tokenFeeController.getSupportedTokens);

export default router;
