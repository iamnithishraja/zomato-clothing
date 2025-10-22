import express from "express";
import {
    createOrder,
    createMultipleOrders,
    getOrderById,
    getOrdersForUser,
    updateOrderStatus,
    getOrderStats
} from "../controllers/orderController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// Order creation - only for customers
router.post("/", isAuthenticated, requireRole(['User']), createOrder);

// Multiple orders creation - for different stores
router.post("/multiple", isAuthenticated, requireRole(['User']), createMultipleOrders);

// IMPORTANT: Specific routes must come BEFORE parametric routes
// Get order statistics - accessible by all authenticated users
router.get("/stats/overview", isAuthenticated, getOrderStats);

// Get orders list - accessible by all authenticated users with proper permissions
router.get("/", isAuthenticated, getOrdersForUser);

// Get order by ID - accessible by all authenticated users with proper permissions
router.get("/:orderId", isAuthenticated, getOrderById);

// Update order status - accessible by all authenticated users with proper permissions
router.put("/:orderId/status", isAuthenticated, updateOrderStatus);

export default router;
