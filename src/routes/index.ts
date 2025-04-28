import { Router } from "express";
import metaTransactionRoutes from "./metaTransactionRoutes";
import spreadFeeRoutes from "./spreadFeeRoutes";
import reserveLimitRoutes from "./reserveLimitRoutes";
import transactionHistoryRoutes from './transactionHistoryRoutes';

const router = Router();

router.use("/api", metaTransactionRoutes);
router.use("/api", spreadFeeRoutes);
router.use("/api", reserveLimitRoutes);
router.use('/api', transactionHistoryRoutes);

export default router;
