import { Router } from "express";
import transactionHistoryController from "../controllers/transactionHistoryController";
import { param, query } from "express-validator";
import { validate } from "../middleware/validator";

const router = Router();

/**
 * Validation rules for transaction history endpoints
 */
const validators = {
  getTransactionHistory: [
    param("address")
      .isString()
      .notEmpty()
      .withMessage("Address is required")
      .isEthereumAddress()
      .withMessage("Valid Ethereum address is required"),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),

    query("filterBy")
      .optional()
      .isIn(["from", "to", "all"])
      .withMessage('FilterBy must be "from", "to", or "all"'),

    query("sort")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage('Sort must be "asc" or "desc"'),

    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("StartDate must be in ISO 8601 format"),

    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("EndDate must be in ISO 8601 format"),
  ],

  getTransactionByHash: [
    param("txHash")
      .isString()
      .notEmpty()
      .withMessage("Transaction hash is required")
      .isHexadecimal()
      .withMessage("Transaction hash must be a hexadecimal string")
      .isLength({ min: 66, max: 66 })
      .withMessage(
        "Transaction hash must be 66 characters long (including 0x prefix)"
      ),
  ],
};

/**
 * @route GET /api/transactions/:address
 * @desc Get transaction history for an address
 * @access Public
 */
router.get(
  "/transactions/:address",
  validators.getTransactionHistory,
  validate,
  transactionHistoryController.getTransactionHistory
);

/**
 * @route GET /api/transaction/:txHash
 * @desc Get transaction details by hash
 * @access Public
 */
router.get(
  "/transaction/:txHash",
  validators.getTransactionByHash,
  validate,
  transactionHistoryController.getTransactionByHash
);

export default router;
