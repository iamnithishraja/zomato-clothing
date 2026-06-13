import express from "express";
import {
  autoAssignDeliveryPartner,
  manuallyAssignDeliveryPartner
} from "../controllers/deliveryAssignmentController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";
import { requireApprovedVerification } from "../middleware/verificationAuth";

const router = express.Router();

// Auto-assign delivery partner (can be triggered by merchant or system)
router.post("/:orderId/auto-assign", isAuthenticated, requireRole(['Merchant']), requireApprovedVerification, autoAssignDeliveryPartner);

// Manually assign delivery partner
router.post("/:orderId/manual-assign", isAuthenticated, requireRole(['Merchant']), requireApprovedVerification, manuallyAssignDeliveryPartner);

export default router;

