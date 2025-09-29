import express from "express";
import {
  createDelivery,
  getDeliveryById,
  updateDeliveryStatus,
  getDeliveriesForDeliveryPerson,
  rateDelivery,
  getDeliveryStats
} from "../controllers/deliveryController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// Delivery creation - only for delivery persons
router.post("/", isAuthenticated, requireRole(['Delivery']), createDelivery);

// Get delivery by ID - accessible by all authenticated users with proper permissions
router.get("/:deliveryId", isAuthenticated, getDeliveryById);

// Update delivery status - only for delivery persons
router.put("/:deliveryId/status", isAuthenticated, requireRole(['Delivery']), updateDeliveryStatus);

// Rate delivery - only for customers
router.post("/:deliveryId/rate", isAuthenticated, requireRole(['User']), rateDelivery);

// Get deliveries for delivery person - only for delivery persons
router.get("/", isAuthenticated, requireRole(['Delivery']), getDeliveriesForDeliveryPerson);

// Get delivery statistics - only for delivery persons
router.get("/stats/overview", isAuthenticated, requireRole(['Delivery']), getDeliveryStats);

export default router;
