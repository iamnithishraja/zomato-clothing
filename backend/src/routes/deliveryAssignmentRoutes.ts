import express from "express";
import {
  autoAssignDeliveryPartner,
  manuallyAssignDeliveryPartner
} from "../controllers/deliveryAssignmentController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// Auto-assign delivery partner (can be triggered by merchant or system)
router.post("/:orderId/auto-assign", isAuthenticated, requireRole(['Merchant']), autoAssignDeliveryPartner);

// Manually assign delivery partner
router.post("/:orderId/manual-assign", isAuthenticated, requireRole(['Merchant']), manuallyAssignDeliveryPartner);

export default router;

