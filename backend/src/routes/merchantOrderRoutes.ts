import express from "express";
import {
  acceptOrder,
  rejectOrder,
  markReadyForPickup,
  getMerchantOrders
} from "../controllers/merchantOrderController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// All routes require merchant role
router.use(isAuthenticated, requireRole(['Merchant']));

// Get merchant's orders
router.get("/", getMerchantOrders);

// Accept an order
router.post("/:orderId/accept", acceptOrder);

// Reject an order
router.post("/:orderId/reject", rejectOrder);

// Mark order as ready for pickup
router.post("/:orderId/ready", markReadyForPickup);

export default router;

