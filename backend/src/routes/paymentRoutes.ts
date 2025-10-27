import express, { Router } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentDetails,
  retryPayment
} from "../controllers/paymentController";
import { isAuthenticated } from "../middleware/auth";

const router: Router = express.Router();

// Create Razorpay order for payment
router.post("/create-order", isAuthenticated, createRazorpayOrder);

// Verify Razorpay payment
router.post("/verify", isAuthenticated, verifyRazorpayPayment);

// Retry payment for pending/failed orders
router.post("/retry/:orderId", isAuthenticated, retryPayment);

// Razorpay webhook (no auth, needs raw body for signature)
router.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  // @ts-ignore - handler supports raw body
  require("../controllers/paymentController").handleRazorpayWebhook
);

// Get payment details for an order
router.get("/:orderId", isAuthenticated, getPaymentDetails);

export default router;

