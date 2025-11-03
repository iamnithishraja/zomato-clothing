import express from "express";
import {
  createDelivery,
  getDeliveryById,
  updateDeliveryStatus,
  rejectDeliveryAssignment,
  getDeliveriesForDeliveryPerson,
  rateDelivery,
  getDeliveryStats,
  updateDeliveryLocation,
  getDeliveryLocation,
  toggleOnlineStatus
} from "../controllers/deliveryController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// Delivery creation - only for delivery persons
router.post("/", isAuthenticated, requireRole(['Delivery']), createDelivery);

// IMPORTANT: Specific routes must come BEFORE parametric routes
// Get delivery statistics - only for delivery persons
router.get("/stats/overview", isAuthenticated, requireRole(['Delivery']), getDeliveryStats);

// Update delivery partner's live location - only for delivery persons
router.patch("/location", isAuthenticated, requireRole(['Delivery']), updateDeliveryLocation);

// Toggle online/offline status - only for delivery persons
router.post("/toggle-online", isAuthenticated, requireRole(['Delivery']), toggleOnlineStatus);

// Get deliveries for delivery person - only for delivery persons
router.get("/", isAuthenticated, requireRole(['Delivery']), getDeliveriesForDeliveryPerson);

// Reject delivery assignment - only for delivery persons
router.post("/:deliveryId/reject", isAuthenticated, requireRole(['Delivery']), rejectDeliveryAssignment);

// Get delivery partner's location by ID - accessible by all authenticated users
router.get("/location/:deliveryPersonId", isAuthenticated, getDeliveryLocation);

// Get delivery by ID - accessible by all authenticated users with proper permissions
router.get("/:deliveryId", isAuthenticated, getDeliveryById);

// Update delivery status - only for delivery persons
router.put("/:deliveryId/status", isAuthenticated, requireRole(['Delivery']), updateDeliveryStatus);

// Rate delivery - only for customers
router.post("/:deliveryId/rate", isAuthenticated, requireRole(['User']), rateDelivery);

export default router;
