import { Router } from "express";
import reserveLimitController from "../controllers/reserveLimitController";
import { body } from "express-validator";
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

export default router;
