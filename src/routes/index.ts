import { Router } from "express";
import metaTransactionRoutes from "./metaTransactionRoutes";

const router = Router();

router.use("/api", metaTransactionRoutes);

export default router;
