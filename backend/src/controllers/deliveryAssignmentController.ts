import type { Request, Response } from "express";
import OrderModel from "../Models/orderModel";
import UserModel from "../Models/userModel";
import DeliveryModel from "../Models/deliveryModel";
import StoreModel from "../Models/storeModel";
import { sendErrorResponse } from "../utils/validation";
import { notifyDeliveryAssigned } from "../utils/notificationUtils";
import type { Types } from "mongoose";

/**
 * Auto-assign nearest available delivery partner
 * This is a simplified version - in production, you'd use geolocation
 */
export async function autoAssignDeliveryPartner(req: Request, res: Response) {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await OrderModel.findById(orderId).populate("store", "address");
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check if order is ready for pickup
    if (order.status !== "ReadyForPickup") {
      return sendErrorResponse(res, 400, "Order must be in ReadyForPickup status");
    }

    // Check if delivery partner already assigned
    if (order.deliveryPerson) {
      return sendErrorResponse(res, 400, "Delivery partner already assigned to this order");
    }

    // Find available delivery partners
    // In a real system, you'd filter by location proximity and availability
    const availableDeliveryPartners = await UserModel.find({
      role: "Delivery",
      isActive: true
    }).limit(10);

    if (availableDeliveryPartners.length === 0) {
      return sendErrorResponse(res, 404, "No delivery partners available");
    }

    // For now, randomly select one (in production, use proximity algorithm)
    const selectedDeliveryPartner = availableDeliveryPartners[
      Math.floor(Math.random() * availableDeliveryPartners.length)
    ];

    if (!selectedDeliveryPartner) {
      return sendErrorResponse(res, 500, "Failed to select delivery partner");
    }

    // Assign delivery partner to order
    order.deliveryPerson = selectedDeliveryPartner._id as any;
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Delivery partner ${selectedDeliveryPartner.name || 'Unknown'} assigned`
    });
    await order.save();

    // Create delivery record
    const store = order.store as any;
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

    // Notify customer and delivery partner
    await notifyDeliveryAssigned(
      order._id,
      order.orderNumber || order._id.toString().slice(-8),
      order.user as unknown as Types.ObjectId,
      selectedDeliveryPartner._id,
      selectedDeliveryPartner.name || "Delivery Partner",
      order.store as unknown as Types.ObjectId
    );

    return res.status(200).json({
      success: true,
      message: "Delivery partner assigned successfully",
      deliveryPartner: {
        _id: selectedDeliveryPartner._id,
        name: selectedDeliveryPartner.name,
        phone: selectedDeliveryPartner.phone
      },
      delivery: {
        _id: delivery._id,
        estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error("Error auto-assigning delivery partner:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

/**
 * Manually assign delivery partner
 */
export async function manuallyAssignDeliveryPartner(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body;

    if (!deliveryPersonId) {
      return sendErrorResponse(res, 400, "Delivery person ID is required");
    }

    // Find order
    const order = await OrderModel.findById(orderId).populate("store", "address");
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Find delivery person
    const deliveryPerson = await UserModel.findById(deliveryPersonId);
    if (!deliveryPerson || deliveryPerson.role !== "Delivery") {
      return sendErrorResponse(res, 404, "Delivery person not found");
    }

    // Assign delivery partner to order
    order.deliveryPerson = deliveryPerson._id as any;
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Delivery partner ${deliveryPerson.name || 'Unknown'} manually assigned`
    });
    await order.save();

    // Create or update delivery record
    let delivery = await DeliveryModel.findOne({ order: order._id });
    
    if (!delivery) {
      const store = order.store as any;
      delivery = new DeliveryModel({
        deliveryPerson: deliveryPerson._id,
        order: order._id,
        pickupAddress: store.address || "Store address",
        deliveryAddress: order.shippingAddress,
        estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000),
        deliveryFee: order.deliveryFee,
        status: "Pending"
      });
      await delivery.save();
    } else {
      delivery.deliveryPerson = deliveryPerson._id as any;
      await delivery.save();
    }

    // Notify customer and delivery partner
    await notifyDeliveryAssigned(
      order._id,
      order.orderNumber || order._id.toString().slice(-8),
      order.user as unknown as Types.ObjectId,
      deliveryPerson._id,
      deliveryPerson.name || "Delivery Partner",
      order.store as unknown as Types.ObjectId
    );

    return res.status(200).json({
      success: true,
      message: "Delivery partner assigned successfully",
      deliveryPartner: {
        _id: deliveryPerson._id,
        name: deliveryPerson.name,
        phone: deliveryPerson.phone
      }
    });

  } catch (error) {
    console.error("Error manually assigning delivery partner:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

