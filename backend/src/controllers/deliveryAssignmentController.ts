import type { Request, Response } from "express";
import OrderModel from "../Models/orderModel";
import UserModel from "../Models/userModel";
import DeliveryModel from "../Models/deliveryModel";
import StoreModel from "../Models/storeModel";
import { sendErrorResponse } from "../utils/validation";
import { notifyDeliveryAssigned } from "../utils/notificationUtils";
import type { Types } from "mongoose";

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Auto-assign nearest available delivery partner within 5km radius
 * Uses proximity-based assignment with Haversine formula
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

    // Get store location (pickup location)
    const store = order.store as any;
    let pickupLat: number | null = null;
    let pickupLng: number | null = null;

    // Try to get coordinates from order.pickupLocation first, then from store
    if (order.pickupLocation?.lat && order.pickupLocation?.lng) {
      pickupLat = order.pickupLocation.lat;
      pickupLng = order.pickupLocation.lng;
    }

    // Find available delivery partners (not busy and active)
    const availableDeliveryPartners = await UserModel.find({
      role: "Delivery",
      isActive: true,
      isBusy: false
    }).lean();

    if (availableDeliveryPartners.length === 0) {
      return sendErrorResponse(res, 404, "No delivery partners available");
    }

    let selectedDeliveryPartner = null;
    let minDistance = Infinity;

    // If we have pickup location, find the nearest delivery partner within 5km
    if (pickupLat && pickupLng) {
      for (const partner of availableDeliveryPartners) {
        if (partner.currentLocation?.lat && partner.currentLocation?.lng) {
          const distance = calculateDistance(
            pickupLat,
            pickupLng,
            partner.currentLocation.lat,
            partner.currentLocation.lng
          );

          // Only consider partners within 5km radius
          if (distance <= 5 && distance < minDistance) {
            minDistance = distance;
            selectedDeliveryPartner = partner;
          }
        }
      }

      // If no partner found within 5km, mark order as waiting
      if (!selectedDeliveryPartner) {
        order.status = "ReadyForPickup"; // Keep status as ReadyForPickup
        order.statusHistory.push({
          status: "ReadyForPickup",
          timestamp: new Date(),
          note: "Waiting for delivery partner - none available within 5km radius"
        });
        await order.save();
        
        return res.status(200).json({
          success: false,
          message: "No delivery partners available within 5km radius. Order marked as waiting.",
          waitingForDeliveryPartner: true
        });
      }
    } else {
      // No location data available, assign randomly from available partners
      console.log("No pickup location available, selecting random delivery partner");
      selectedDeliveryPartner = availableDeliveryPartners[
        Math.floor(Math.random() * availableDeliveryPartners.length)
      ];
    }

    if (!selectedDeliveryPartner) {
      return sendErrorResponse(res, 500, "Failed to select delivery partner");
    }

    // Assign delivery partner to order and mark partner as busy
    order.deliveryPerson = selectedDeliveryPartner._id as any;
    order.status = "Assigned";
    order.statusHistory.push({
      status: "Assigned",
      timestamp: new Date(),
      note: `Delivery partner ${selectedDeliveryPartner.name || 'Unknown'} assigned${pickupLat && pickupLng && minDistance !== Infinity ? ` (${minDistance.toFixed(2)}km away)` : ''}`
    });
    await order.save();

    // Mark delivery partner as busy and set current order
    await UserModel.findByIdAndUpdate(selectedDeliveryPartner._id, {
      isBusy: true,
      currentOrder: order._id
    });

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

