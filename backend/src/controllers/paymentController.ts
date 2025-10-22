import type { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import OrderModel from "../Models/orderModel";
import PaymentModel from "../Models/paymentModel";
import StoreModel from "../Models/storeModel";
import { sendErrorResponse } from "../utils/validation";
import { notifyPaymentSuccess, notifyPaymentFailed } from "../utils/notificationUtils";
import { releaseInventory } from "../utils/orderUtils";
import type { Types } from "mongoose";

// Initialize Razorpay instance
let razorpayInstance: Razorpay | null = null;

export function initializeRazorpay(keyId: string, keySecret: string) {
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
  console.log("Razorpay initialized successfully");
}

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderId } = req.body;

    if (!orderId) {
      return sendErrorResponse(res, 400, "Order ID is required");
    }

    // Find the order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check if user owns the order
    if (order.user.toString() !== user._id.toString()) {
      return sendErrorResponse(res, 403, "Access denied");
    }

    // Check if order is already paid
    if (order.paymentStatus === "Completed") {
      return sendErrorResponse(res, 400, "Order is already paid");
    }

    // Check if payment method is Online
    if (order.paymentMethod !== "Online") {
      return sendErrorResponse(res, 400, "Order payment method is not Online");
    }

    if (!razorpayInstance) {
      return sendErrorResponse(res, 500, "Payment gateway not initialized");
    }

    // Create Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(order.totalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: order.orderNumber || order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: user._id.toString(),
        storeId: order.store.toString()
      }
    });

    // Create payment record
    const payment = new PaymentModel({
      order: order._id,
      user: user._id,
      store: order.store,
      amount: order.totalAmount,
      paymentMethod: "Online",
      paymentStatus: "Pending",
      paymentGateway: "Razorpay",
      gatewayOrderId: razorpayOrder.id
    });

    await payment.save();

    // Update order with payment reference
    order.paymentId = payment._id as any;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      paymentId: payment._id
    });

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return sendErrorResponse(res, 500, "Failed to create payment order");
  }
}

/**
 * Verify Razorpay payment
 */
export async function verifyRazorpayPayment(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
      return sendErrorResponse(res, 400, "Missing payment verification details");
    }

    // Find payment record
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      return sendErrorResponse(res, 404, "Payment record not found");
    }

    // Find order
    const order = await OrderModel.findById(payment.order);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check if user owns the order
    if (order.user.toString() !== user._id.toString()) {
      return sendErrorResponse(res, 403, "Access denied");
    }

    if (!razorpayInstance) {
      return sendErrorResponse(res, 500, "Payment gateway not initialized");
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Signature verification failed
      payment.paymentStatus = "Failed";
      payment.notes = "Signature verification failed";
      await payment.save();

      order.paymentStatus = "Failed";
      await order.save();

      // Release inventory
      await releaseInventory(order.orderItems);

      // Notify user
      await notifyPaymentFailed(
        order._id,
        order.orderNumber || order._id.toString().slice(-8),
        user._id,
        order.totalAmount,
        order.store as unknown as Types.ObjectId
      );

      return sendErrorResponse(res, 400, "Payment verification failed");
    }

    // Payment verified successfully
    payment.paymentStatus = "Completed";
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.gatewaySignature = razorpay_signature;
    payment.transactionId = razorpay_payment_id;
    payment.transactionDate = new Date();
    await payment.save();

    // Update order
    order.paymentStatus = "Completed";
    order.status = "Accepted"; // Auto-accept order after payment
    order.statusHistory.push({
      status: "Accepted",
      timestamp: new Date(),
      updatedBy: user._id,
      note: "Payment completed successfully"
    });
    await order.save();

    // Notify user
    await notifyPaymentSuccess(
      order._id,
      order.orderNumber || order._id.toString().slice(-8),
      user._id,
      order.totalAmount,
      order.store as unknown as Types.ObjectId
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status
      }
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    return sendErrorResponse(res, 500, "Payment verification failed");
  }
}

/**
 * Handle Razorpay webhook
 */
export async function handleRazorpayWebhook(req: Request, res: Response) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-razorpay-signature"] as string;

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error("Webhook signature verification failed");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log(`Webhook received: ${event}`);

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;
      
      case "payment.failed":
        await handlePaymentFailed(payload);
        break;
      
      case "refund.created":
        await handleRefundCreated(payload);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });

  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
}

async function handlePaymentCaptured(payload: any) {
  try {
    const payment = await PaymentModel.findOne({ gatewayOrderId: payload.order_id });
    if (!payment) {
      console.error("Payment record not found for order:", payload.order_id);
      return;
    }

    if (payment.paymentStatus !== "Completed") {
      payment.paymentStatus = "Completed";
      payment.gatewayPaymentId = payload.id;
      payment.transactionId = payload.id;
      payment.transactionDate = new Date();
      await payment.save();

      const order = await OrderModel.findById(payment.order);
      if (order && order.paymentStatus !== "Completed") {
        order.paymentStatus = "Completed";
        order.status = "Accepted";
        order.statusHistory.push({
          status: "Accepted",
          timestamp: new Date(),
          note: "Payment captured via webhook"
        });
        await order.save();
      }
    }
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(payload: any) {
  try {
    const payment = await PaymentModel.findOne({ gatewayOrderId: payload.order_id });
    if (!payment) {
      console.error("Payment record not found for order:", payload.order_id);
      return;
    }

    payment.paymentStatus = "Failed";
    payment.notes = payload.error_description || "Payment failed";
    await payment.save();

    const order = await OrderModel.findById(payment.order);
    if (order) {
      order.paymentStatus = "Failed";
      order.status = "Cancelled";
      order.cancellationReason = "Payment failed";
      order.cancelledAt = new Date();
      await order.save();

      // Release inventory
      await releaseInventory(order.orderItems);
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleRefundCreated(payload: any) {
  try {
    const payment = await PaymentModel.findOne({ gatewayPaymentId: payload.payment_id });
    if (!payment) {
      console.error("Payment record not found for payment:", payload.payment_id);
      return;
    }

    payment.paymentStatus = "Refunded";
    payment.refundAmount = payload.amount / 100; // Convert from paise
    payment.refundTransactionId = payload.id;
    payment.refundDate = new Date();
    await payment.save();

    const order = await OrderModel.findById(payment.order);
    if (order) {
      order.paymentStatus = "Refunded";
      await order.save();
    }
  } catch (error) {
    console.error("Error handling refund created:", error);
  }
}

/**
 * Get payment details for an order
 */
export async function getPaymentDetails(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check permissions
    if (user.role === "User" && order.user.toString() !== user._id.toString()) {
      return sendErrorResponse(res, 403, "Access denied");
    }

    if (user.role === "Merchant") {
      const store = await StoreModel.findOne({ merchantId: user._id });
      if (!store || order.store.toString() !== store._id.toString()) {
        return sendErrorResponse(res, 403, "Access denied");
      }
    }

    const payment = await PaymentModel.findOne({ order: orderId })
      .populate("user", "name phone email")
      .populate("store", "storeName");

    if (!payment) {
      return sendErrorResponse(res, 404, "Payment record not found");
    }

    return res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully",
      payment
    });

  } catch (error) {
    console.error("Error getting payment details:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

/**
 * Retry payment for a pending/failed order
 */
export async function retryPayment(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;

    // Find order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check if user owns the order
    if (order.user.toString() !== user._id.toString()) {
      return sendErrorResponse(res, 403, "Access denied. You can only retry payment for your own orders");
    }

    // Check if payment is pending or failed
    if (!['Pending', 'Failed'].includes(order.paymentStatus)) {
      return sendErrorResponse(res, 400, `Cannot retry payment. Current payment status: ${order.paymentStatus}`);
    }

    // Check if payment method is online
    if (order.paymentMethod !== 'Online') {
      return sendErrorResponse(res, 400, "Payment retry is only available for online payments");
    }

    if (!razorpayInstance) {
      return sendErrorResponse(res, 500, "Payment gateway not initialized");
    }

    // Create new Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(order.totalAmount * 100), // Convert to paise
      currency: "INR",
      receipt: `retry_${order._id}_${Date.now()}`,
      notes: {
        orderId: order._id.toString(),
        userId: user._id.toString(),
        retry: "true"
      }
    });

    // Update or create payment record
    let payment = await PaymentModel.findById(order.paymentId);
    
    if (payment) {
      // Update existing payment record
      payment.gatewayOrderId = razorpayOrder.id;
      payment.paymentStatus = "Pending";
      payment.notes = "Payment retry initiated";
      await payment.save();
    } else {
      // Create new payment record if not exists
      payment = new PaymentModel({
        order: order._id,
        user: user._id,
        store: order.store,
        amount: order.totalAmount,
        paymentMethod: "Online",
        paymentStatus: "Pending",
        paymentGateway: "Razorpay",
        gatewayOrderId: razorpayOrder.id
      });
      await payment.save();
      
      order.paymentId = payment._id as any;
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment retry initiated successfully",
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      paymentId: payment._id
    });

  } catch (error) {
    console.error("Error retrying payment:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

