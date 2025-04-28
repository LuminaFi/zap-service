import { Router } from "express";
import metaTransactionController from "../controllers/metaTransactionController";
import { validators, validate } from "../middleware/validator";

const router = Router();

/**
 * @route POST /api/meta-transfer
 * @desc Execute meta-transaction to transfer IDRX
 * @access Public
 */
router.post(
  "/meta-transfer",
  validators.metaTransfer,
  validate,
  metaTransactionController.executeTransfer
);

/**
 * @route GET /api/status
 * @desc Get service status
 * @access Public
 */
router.get("/status", metaTransactionController.getServiceStatus);

/**
 * @route GET /api/health
 * @desc Health check endpoint
 * @access Public
 */
router.get("/health", metaTransactionController.healthCheck);

export default router;
