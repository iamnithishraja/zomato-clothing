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

// Get order by ID - accessible by all authenticated users with proper permissions
router.get("/:orderId", isAuthenticated, getOrderById);

// Get orders list - accessible by all authenticated users with proper permissions
router.get("/", isAuthenticated, getOrdersForUser);

// Update order status - accessible by all authenticated users with proper permissions
router.put("/:orderId/status", isAuthenticated, updateOrderStatus);

// Get order statistics - accessible by all authenticated users
router.get("/stats/overview", isAuthenticated, getOrderStats);

export default router;
