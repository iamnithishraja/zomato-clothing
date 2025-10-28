import express from "express";
import {
  getSettlementReport,
  getPayoutSummary,
  createPayout
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

// Create payout for a period
router.post("/payouts", createPayout);

export default router;

