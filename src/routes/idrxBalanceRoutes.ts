import { Router } from "express";
import idrxBalanceController from "../controllers/idrxBalanceController";
import { param } from "express-validator";
import { validate } from "../middleware/validator";

const router = Router();

/**
 * Validation rules for IDRX balance endpoints
 */
const validators = {
  getBalance: [
    param("address")
      .isString()
      .notEmpty()
      .withMessage("Address is required")
      .isEthereumAddress()
      .withMessage("Valid Ethereum address is required"),
  ],
};

/**
 * @route GET /api/idrx-balance/:address
 * @desc Get IDRX token balance for an address
 * @access Public
 */
router.get(
  "/idrx-balance/:address",
  validators.getBalance,
  validate,
  idrxBalanceController.getBalance
);

/**
 * @route GET /api/idrx-token-info
 * @desc Get IDRX token information
 * @access Public
 */
router.get("/idrx-token-info", idrxBalanceController.getTokenInfo);

export default router;
