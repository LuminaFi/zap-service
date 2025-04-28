import { Router } from "express";
import metaTransactionRoutes from "./metaTransactionRoutes";
import spreadFeeRoutes from "./spreadFeeRoutes";

const router = Router();

// Register all routes
router.use("/api", metaTransactionRoutes);
router.use("/api", spreadFeeRoutes);

export default router;
