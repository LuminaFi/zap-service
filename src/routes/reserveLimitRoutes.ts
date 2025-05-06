import { Router } from "express";
import reserveLimitController from "../controllers/reserveLimitController";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validator";

const router = Router();

/**
 * Validation rules for reserve limit endpoints
 */
const validators = {
  updateTransferLimits: [
    body("minAmount")
      .isString()
      .notEmpty()
      .withMessage("Minimum amount is required")
      .matches(/^[0-9]*\.?[0-9]+$/)
      .withMessage("Minimum amount must be a valid number"),

    body("maxAmount")
      .isString()
      .notEmpty()
      .withMessage("Maximum amount is required")
      .matches(/^[0-9]*\.?[0-9]+$/)
      .withMessage("Maximum amount must be a valid number"),
  ],
};

/**
 * Validation rules for max transfer limit endpoint
 */
const maxTransferLimitValidators = [
  param("token").isString().notEmpty().withMessage("Token symbol is required"),
  query("amount")
    .optional()
    .isFloat({ min: 0.000001 })
    .withMessage("Amount must be a positive number"),
];

/**
 * @route GET /api/transfer-limits
 * @desc Calculate transfer limits based on reserve pool
 * @access Public
 */
router.get("/transfer-limits", reserveLimitController.calculateTransferLimits);

/**
 * @route POST /api/transfer-limits
 * @desc Update contract transfer limits
 * @access Private (should be restricted with auth middleware in production)
 */
router.post(
  "/transfer-limits",
  validators.updateTransferLimits,
  validate,
  reserveLimitController.updateTransferLimits
);

/**
 * @route GET /api/max-transfer-limit/:token
 * @desc Get maximum transfer limit based on sender token
 * @access Public
 */
router.get(
  "/max-transfer-limit/:token",
  maxTransferLimitValidators,
  validate,
  reserveLimitController.getMaxTransferLimitBySenderToken
);

export default router;
