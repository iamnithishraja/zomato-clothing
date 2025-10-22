import express from "express";
import {
  getSettlementReport,
  getPayoutSummary
} from "../controllers/settlementController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// All routes require merchant role
router.use(isAuthenticated, requireRole(['Merchant']));

// Get settlement report
router.get("/report", getSettlementReport);

// Get payout summary
router.get("/payout-summary", getPayoutSummary);

export default router;

