import { Router } from "express";
import metaTransactionRoutes from "./metaTransactionRoutes";
import spreadFeeRoutes from "./spreadFeeRoutes";
import reserveLimitRoutes from "./reserveLimitRoutes";

const router = Router();

router.use("/api", metaTransactionRoutes);
router.use("/api", spreadFeeRoutes);
router.use("/api", reserveLimitRoutes);

export default router;
