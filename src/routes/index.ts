import { Router } from "express";
import metaTransactionRoutes from "./metaTransactionRoutes";
import spreadFeeRoutes from "./spreadFeeRoutes";
import reserveLimitRoutes from "./reserveLimitRoutes";
import transactionHistoryRoutes from './transactionHistoryRoutes';
import tokenFeeRoutes from './tokenFeeRoutes';

const router = Router();

router.use("/api", metaTransactionRoutes);
router.use("/api", spreadFeeRoutes);
router.use("/api", reserveLimitRoutes);
router.use('/api', transactionHistoryRoutes);
router.use('/api', tokenFeeRoutes);

export default router;
