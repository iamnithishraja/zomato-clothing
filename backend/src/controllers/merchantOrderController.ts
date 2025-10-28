import type { Request, Response } from "express";
import OrderModel from "../Models/orderModel";
import StoreModel from "../Models/storeModel";
import PaymentModel from "../Models/paymentModel";
import { sendErrorResponse } from "../utils/validation";
import Razorpay from "razorpay";
import { releaseInventory } from "../utils/orderUtils";
import { notifyOrderAccepted, notifyOrderRejected, notifyOrderReady } from "../utils/notificationUtils";
import type { Types } from "mongoose";
import z from "zod";

/**
 * Accept order by merchant
 */
export async function acceptOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;

    if (user.role !== "Merchant") {
      return sendErrorResponse(res, 403, "Only merchants can accept orders");
    }

    // Find merchant's store
    const store = await StoreModel.findOne({ merchantId: user._id });
    if (!store) {
      return sendErrorResponse(res, 404, "Store not found for this merchant");
    }

    // Find order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check if order belongs to merchant's store
    if (order.store.toString() !== store._id.toString()) {
      return sendErrorResponse(res, 403, "This order does not belong to your store");
    }

    // Check if order is in Pending status
    if (order.status !== "Pending") {
      return sendErrorResponse(res, 400, `Cannot accept order with status: ${order.status}`);
    }

    // For online payment, check if payment is completed
    if (order.paymentMethod === "Online" && order.paymentStatus !== "Completed") {
      return sendErrorResponse(res, 400, "Payment not completed for this order");
    }

    // Accept the order
    order.status = "Accepted";
    order.merchantAcceptedAt = new Date();
    order.statusHistory.push({
      status: "Accepted",
      timestamp: new Date(),
      updatedBy: user._id,
      note: "Order accepted by merchant"
    });
    await order.save();

    // Notify customer
    await notifyOrderAccepted(
      order._id,
      order.orderNumber || order._id.toString().slice(-8),
      order.user as any,
      store._id,
      store.storeName
    );

    return res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      order
    });

  } catch (error) {
    console.error("Error accepting order:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

/**
 * Reject order by merchant
 */
export async function rejectOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return sendErrorResponse(res, 400, "Rejection reason is required (minimum 10 characters)");
    }

    if (user.role !== "Merchant") {
      return sendErrorResponse(res, 403, "Only merchants can reject orders");
    }

    // Find merchant's store
    const store = await StoreModel.findOne({ merchantId: user._id });
    if (!store) {
      return sendErrorResponse(res, 404, "Store not found for this merchant");
    }

    // Find order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check if order belongs to merchant's store
    if (order.store.toString() !== store._id.toString()) {
      return sendErrorResponse(res, 403, "This order does not belong to your store");
    }

    // Check if order is in Pending status
    if (order.status !== "Pending") {
      return sendErrorResponse(res, 400, `Cannot reject order with status: ${order.status}`);
    }

    // Reject the order
    order.status = "Rejected";
    order.rejectionReason = reason.trim();
    order.statusHistory.push({
      status: "Rejected",
      timestamp: new Date(),
      updatedBy: user._id,
      note: `Order rejected: ${reason.trim()}`
    });
    await order.save();

    // Release inventory
    await releaseInventory(order.orderItems);

    // Handle refund for online payments (Razorpay)
    if (order.paymentMethod === "Online" && order.paymentStatus === "Completed") {
      try {
        const payment = await PaymentModel.findById(order.paymentId);
        if (payment && payment.gatewayPaymentId) {
          const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEYID || "";
          const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_API_SECRET || "";
          const rp = new Razorpay({ key_id: keyId, key_secret: keySecret });

          const refund = await rp.payments.refund(payment.gatewayPaymentId, {
            amount: Math.round((payment.amount || 0) * 100),
            speed: "optimum",
            notes: { reason: "Order rejected by merchant", orderId: String(order._id) }
          } as any);

          // Update payment with refund details
          payment.paymentStatus = "Refunded";
          payment.refundAmount = (refund.amount || 0) / 100;
          payment.refundReason = "Order rejected by merchant";
          payment.refundDate = new Date();
          payment.refundTransactionId = refund.id;
          await payment.save();

          // Update order payment status
          order.paymentStatus = "Refunded";
          await order.save();
        } else {
          console.warn("Payment record missing or no gatewayPaymentId for refund", order._id);
        }
      } catch (refundErr) {
        console.error("Refund error:", refundErr);
        // Do not fail the rejection if refund fails; client can retry via admin
      }
    }

    // Notify customer
    await notifyOrderRejected(
      order._id,
      order.orderNumber || order._id.toString().slice(-8),
      order.user as any,
      store._id,
      store.storeName,
      reason.trim()
    );

    return res.status(200).json({
      success: true,
      message: "Order rejected successfully",
      order
    });

  } catch (error) {
    console.error("Error rejecting order:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

/**
 * Mark order as ready for pickup
 */
export async function markReadyForPickup(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;

    if (user.role !== "Merchant") {
      return sendErrorResponse(res, 403, "Only merchants can mark orders as ready");
    }

    // Find merchant's store
    const store = await StoreModel.findOne({ merchantId: user._id });
    if (!store) {
      return sendErrorResponse(res, 404, "Store not found for this merchant");
    }

    // Find order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check if order belongs to merchant's store
    if (order.store.toString() !== store._id.toString()) {
      return sendErrorResponse(res, 403, "This order does not belong to your store");
    }

    // Check if order is in Accepted or Processing status
    if (!["Accepted", "Processing"].includes(order.status)) {
      return sendErrorResponse(res, 400, `Cannot mark order as ready from status: ${order.status}`);
    }

    // Update order status
    order.status = "ReadyForPickup";
    order.statusHistory.push({
      status: "ReadyForPickup",
      timestamp: new Date(),
      updatedBy: user._id,
      note: "Order packed and ready for pickup"
    });
    await order.save();

    // Notify customer
    await notifyOrderReady(
      order._id,
      order.orderNumber || order._id.toString().slice(-8),
      order.user as any,
      store._id,
      store.storeName
    );

    // Auto-assign delivery partner
    try {
      const UserModel = (await import("../Models/userModel")).default;
      const DeliveryModel = (await import("../Models/deliveryModel")).default;
      const { notifyDeliveryAssigned } = await import("../utils/notificationUtils");

      // Find available delivery partners
      const availableDeliveryPartners = await UserModel.find({
        role: "Delivery",
        isActive: true
      }).limit(10);

      if (availableDeliveryPartners.length > 0) {
        // Randomly select one (in production, use proximity algorithm)
        const selectedDeliveryPartner = availableDeliveryPartners[
          Math.floor(Math.random() * availableDeliveryPartners.length)
        ];

        if (selectedDeliveryPartner) {
          // Assign delivery partner to order
          order.deliveryPerson = selectedDeliveryPartner._id as any;
          order.statusHistory.push({
            status: order.status,
            timestamp: new Date(),
            note: `Delivery partner ${selectedDeliveryPartner.name || 'Unknown'} auto-assigned`
          });
          await order.save();

          // Create delivery record
          const delivery = new DeliveryModel({
            deliveryPerson: selectedDeliveryPartner._id,
            order: order._id,
            pickupAddress: store.address || "Store address",
            deliveryAddress: order.shippingAddress,
            estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            deliveryFee: order.deliveryFee,
            status: "Pending"
          });
          await delivery.save();

          // Notify delivery partner
          await notifyDeliveryAssigned(
            order._id,
            order.orderNumber || order._id.toString().slice(-8),
            order.user as any,
            selectedDeliveryPartner._id,
            selectedDeliveryPartner.name || "Delivery Partner",
            store._id
          );

          console.log(`Delivery partner ${selectedDeliveryPartner.name} auto-assigned to order ${order._id}`);
        } else {
          console.log(`Failed to select delivery partner for order ${order._id}`);
        }
      } else {
        console.log(`No delivery partners available for order ${order._id}`);
      }
    } catch (assignError) {
      console.error("Error auto-assigning delivery partner:", assignError);
      // Don't fail the entire request if auto-assignment fails
    }

    return res.status(200).json({
      success: true,
      message: "Order marked as ready for pickup and delivery partner assigned",
      order
    });

  } catch (error) {
    console.error("Error marking order ready:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

/**
 * Get merchant's orders
 */
export async function getMerchantOrders(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (user.role !== "Merchant") {
      return sendErrorResponse(res, 403, "Only merchants can access this endpoint");
    }

    // Find merchant's store
    const store = await StoreModel.findOne({ merchantId: user._id });
    if (!store) {
      return sendErrorResponse(res, 404, "Store not found for this merchant");
    }

    // Get query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    // Build filter
    const filter: any = { store: store._id };
    if (status) {
      filter.status = status;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get orders
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name phone email")
      .populate("orderItems.product", "name images price");

    const totalOrders = await OrderModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNextPage: page < Math.ceil(totalOrders / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error getting merchant orders:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

