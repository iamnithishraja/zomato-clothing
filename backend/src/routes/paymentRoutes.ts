import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  getPaymentDetails,
  retryPayment
} from "../controllers/paymentController";
import { isAuthenticated } from "../middleware/auth";

const router = express.Router();

// Create Razorpay order for payment
router.post("/create-order", isAuthenticated, createRazorpayOrder);

// Verify Razorpay payment
router.post("/verify", isAuthenticated, verifyRazorpayPayment);

// Retry payment for pending/failed orders
router.post("/retry/:orderId", isAuthenticated, retryPayment);

// Razorpay webhook (no authentication required)
router.post("/webhook/razorpay", handleRazorpayWebhook);

// Get payment details for an order
router.get("/:orderId", isAuthenticated, getPaymentDetails);

export default router;

