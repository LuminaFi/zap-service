import { Router } from "express";
import metaTransactionRoutes from "./metaTransactionRoutes";
import reserveLimitRoutes from "./reserveLimitRoutes";
import transactionHistoryRoutes from './transactionHistoryRoutes';
import tokenFeeRoutes from './tokenFeeRoutes';
import idrxBalanceRoutes from './idrxBalanceRoutes';

const router = Router();

router.use("/api", metaTransactionRoutes);
router.use("/api", reserveLimitRoutes);
router.use('/api', transactionHistoryRoutes);
router.use('/api', tokenFeeRoutes);
router.use('/api', idrxBalanceRoutes);

export default router;
