import DeliveryModel from "../Models/deliveryModel";
import OrderModel from "../Models/orderModel";
import StoreModel from "../Models/storeModel";
import UserModel from "../Models/userModel";
import { notifyOrderPickedUp, notifyOrderDelivered } from "../utils/notificationUtils";
import { type IDelivery } from "../types/delivery";
import type { Response, Request } from "express";
import z from "zod";

// Validation schema for delivery creation
const createDeliverySchema = z.object({
  order: z.string().min(1, "Order ID is required"),
  pickupAddress: z.string().min(10, "Pickup address must be at least 10 characters"),
  deliveryAddress: z.string().min(10, "Delivery address must be at least 10 characters"),
  estimatedDeliveryTime: z.string().datetime("Invalid estimated delivery time"),
  deliveryFee: z.number().min(0, "Delivery fee must be non-negative")
});

// Validation schema for delivery status update
const updateDeliveryStatusSchema = z.object({
  status: z.enum(["Pending", "Accepted", "PickedUp", "OnTheWay", "Delivered", "Cancelled"], {
    message: "Invalid delivery status"
  }),
  deliveryNotes: z.string().optional(),
  cancellationReason: z.string().optional()
});

// Validation schema for delivery rating
const rateDeliverySchema = z.object({
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  review: z.string().max(500, "Review must be less than 500 characters").optional()
});

async function createDelivery(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Check if user is a delivery person
    if (user.role !== 'Delivery') {
      return res.status(403).json({
        success: false,
        message: "Only delivery persons can create deliveries"
      });
    }

    // Validate request body
    const validatedData = createDeliverySchema.parse(req.body);
    const { order, pickupAddress, deliveryAddress, estimatedDeliveryTime, deliveryFee } = validatedData;

    // Check if order exists and is ready for delivery
    const orderDoc = await OrderModel.findById(order)
      .populate('user', 'name phone')
      .populate('store', 'storeName address');

    if (!orderDoc) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!['Processing', 'ReadyForPickup'].includes(orderDoc.status as any)) {
      return res.status(400).json({
        success: false,
        message: "Order is not ready for delivery. Current status: " + orderDoc.status
      });
    }

    // Check if delivery already exists for this order
    const existingDelivery = await DeliveryModel.findOne({ order });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: "Delivery already exists for this order"
      });
    }

    // Create delivery
    const delivery = new DeliveryModel({
      deliveryPerson: user._id,
      order,
      pickupAddress: pickupAddress.trim(),
      deliveryAddress: deliveryAddress.trim(),
      estimatedDeliveryTime: new Date(estimatedDeliveryTime),
      deliveryFee
    });

    await delivery.save();

    // Associate delivery person on the order (do not change order status here; it will become Shipped on PickedUp)
    await OrderModel.findByIdAndUpdate(order, { 
      deliveryPerson: user._id
    });

    // Populate delivery details for response
    const populatedDelivery = await DeliveryModel.findById(delivery._id)
      .populate('deliveryPerson', 'name phone')
      .populate('order')
      .populate({
        path: 'order',
        populate: {
          path: 'user',
          select: 'name phone'
        }
      })
      .populate({
        path: 'order',
        populate: {
          path: 'store',
          select: 'storeName address mapLink'
        }
      });

    return res.status(201).json({
      success: true,
      message: "Delivery created successfully",
      delivery: populatedDelivery
    });

  } catch (error) {
    console.error("Error creating delivery:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function getDeliveryById(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { deliveryId } = req.params;

    if (!deliveryId) {
      return res.status(400).json({
        success: false,
        message: "Delivery ID is required"
      });
    }

    const delivery = await DeliveryModel.findById(deliveryId)
      .populate('deliveryPerson', 'name phone email')
      .populate({
        path: 'order',
        populate: [
          {
            path: 'user',
            select: 'name phone email address'
          },
          {
            path: 'store',
            select: 'storeName address storeImages mapLink'
          },
          {
            path: 'orderItems.product',
            select: 'name images price'
          }
        ]
      });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found"
      });
    }

    // Check permissions
    const deliveryPersonId = typeof delivery.deliveryPerson === 'object' 
      ? (delivery.deliveryPerson as any)._id 
      : delivery.deliveryPerson;
    
    if (user.role === 'Delivery' && deliveryPersonId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own deliveries"
      });
    }

    if (user.role === 'User' && (delivery.order as any).user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view deliveries for your orders"
      });
    }

    if (user.role === 'Merchant') {
      const store = await StoreModel.findOne({ merchantId: user._id });
      if (!store || (delivery.order as any).store._id.toString() !== store._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view deliveries for your store orders"
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Delivery retrieved successfully",
      delivery
    });

  } catch (error) {
    console.error("Error getting delivery:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function updateDeliveryStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { deliveryId } = req.params;

    if (!deliveryId) {
      return res.status(400).json({
        success: false,
        message: "Delivery ID is required"
      });
    }

    // Validate request body
    const validatedData = updateDeliveryStatusSchema.parse(req.body);
    const { status, deliveryNotes, cancellationReason } = validatedData;

    // Find the delivery
    const delivery = await DeliveryModel.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found"
      });
    }

    // Check permissions
    if (user.role === 'Delivery' && delivery.deliveryPerson.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own deliveries"
      });
    }

    // Validate status transitions
    const validTransitions: { [key: string]: string[] } = {
      'Pending': ['Accepted', 'Cancelled'],
      'Accepted': ['PickedUp', 'Cancelled'],
      'PickedUp': ['OnTheWay', 'Delivered', 'Cancelled'],
      'OnTheWay': ['Delivered', 'Cancelled'],
      'Delivered': [],
      'Cancelled': []
    };

    if (!validTransitions[delivery.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${delivery.status} to ${status}`
      });
    }

    // Update delivery
    const updateData: any = { status };
    if (deliveryNotes) {
      updateData.deliveryNotes = deliveryNotes;
    }
    if (status === 'Cancelled' && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }
    if (status === 'Delivered') {
      updateData.actualDeliveryTime = new Date();
    }

    const updatedDelivery = await DeliveryModel.findByIdAndUpdate(
      deliveryId,
      updateData,
      { new: true }
    ).populate('deliveryPerson', 'name phone')
     .populate({
       path: 'order',
       populate: {
         path: 'user',
         select: 'name phone'
       }
     })
     .populate({
       path: 'order',
       populate: {
         path: 'store',
         select: 'storeName'
       }
     });

    // Update order status and send notifications for key delivery transitions
    if (status === 'PickedUp') {
      await OrderModel.findByIdAndUpdate(delivery.order, {
        status: 'PickedUp',
        $push: {
          statusHistory: {
            status: 'PickedUp',
            timestamp: new Date(),
            note: 'Order picked up by delivery partner'
          }
        }
      });
      try {
        const orderDoc = await OrderModel.findById(delivery.order).populate('store', 'storeName').populate('user','_id').lean();
        if (orderDoc && updatedDelivery?.deliveryPerson) {
          await notifyOrderPickedUp(
            orderDoc._id,
            orderDoc.orderNumber || orderDoc._id.toString().slice(-8),
            orderDoc.user as any,
            (updatedDelivery.deliveryPerson as any).name || 'Delivery Partner',
            (orderDoc.store as any)?._id
          );
        }
      } catch (e) {
        console.error('Failed to send pickup notification', e);
      }
    } else if (status === 'OnTheWay') {
      await OrderModel.findByIdAndUpdate(delivery.order, {
        status: 'OnTheWay',
        $push: {
          statusHistory: {
            status: 'OnTheWay',
            timestamp: new Date(),
            note: 'Delivery partner is on the way to delivery location'
          }
        }
      });
    } else if (status === 'Delivered') {
      // Enforce COD collection before marking delivery delivered
      try {
        const ord = await OrderModel.findById(delivery.order).lean();
        if (ord && ord.paymentMethod === 'COD' && ord.paymentStatus !== 'Completed') {
          return res.status(400).json({
            success: false,
            message: 'Collect COD payment before marking as Delivered'
          });
        }
      } catch (e) {
        // fallthrough; if lookup fails we let normal error handling proceed below
      }
      await OrderModel.findByIdAndUpdate(delivery.order, { 
        status: 'Delivered',
        deliveryDate: new Date(),
        $push: {
          statusHistory: {
            status: 'Delivered',
            timestamp: new Date(),
            note: 'Order delivered successfully'
          }
        }
      });
      try {
        const orderDoc = await OrderModel.findById(delivery.order).populate('user','_id').lean();
        if (orderDoc) {
          await notifyOrderDelivered(
            orderDoc._id,
            orderDoc.orderNumber || orderDoc._id.toString().slice(-8),
            orderDoc.user as any,
            (orderDoc.store as any)
          );
        }
      } catch (e) {
        console.error('Failed to send delivered notification', e);
      }
    } else if (status === 'Cancelled') {
      await OrderModel.findByIdAndUpdate(delivery.order, { 
        status: 'ReadyForPickup',
        $unset: { deliveryPerson: 1 }
      });
      
      // Mark delivery partner as not busy and clear current order
      await UserModel.findByIdAndUpdate(delivery.deliveryPerson, {
        isBusy: false,
        $unset: { currentOrder: 1 }
      });
    }

    // Mark delivery partner as not busy after successful delivery
    if (status === 'Delivered') {
      await UserModel.findByIdAndUpdate(delivery.deliveryPerson, {
        isBusy: false,
        $unset: { currentOrder: 1 }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      delivery: updatedDelivery
    });

  } catch (error) {
    console.error("Error updating delivery status:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function getDeliveriesForDeliveryPerson(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Check if user is a delivery person
    if (user.role !== 'Delivery') {
      return res.status(403).json({
        success: false,
        message: "Only delivery persons can access this endpoint"
      });
    }

    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    // Build filter object
    const filter: any = { deliveryPerson: user._id };
    if (status) {
      filter.status = status;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get deliveries with pagination
    const deliveries = await DeliveryModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'order',
        populate: {
          path: 'user',
          select: 'name phone'
        }
      })
      .populate({
        path: 'order',
        populate: {
          path: 'store',
          select: 'storeName address mapLink'
        }
      });

    // Get total count for pagination
    const totalDeliveries = await DeliveryModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Deliveries retrieved successfully",
      deliveries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeliveries / limit),
        totalDeliveries,
        hasNextPage: page < Math.ceil(totalDeliveries / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error getting deliveries for delivery person:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function rateDelivery(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { deliveryId } = req.params;

    if (!deliveryId) {
      return res.status(400).json({
        success: false,
        message: "Delivery ID is required"
      });
    }

    // Validate request body
    const validatedData = rateDeliverySchema.parse(req.body);
    const { rating, review } = validatedData;

    // Find the delivery
    const delivery = await DeliveryModel.findById(deliveryId)
      .populate({
        path: 'order',
        populate: {
          path: 'user',
          select: '_id'
        }
      });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found"
      });
    }

    // Check if user is the customer who placed the order
    if (user.role !== 'User' || (delivery.order as any).user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the customer who placed the order can rate the delivery"
      });
    }

    // Check if delivery is completed
    if (delivery.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed deliveries"
      });
    }

    // Check if already rated
    if (delivery.rating) {
      return res.status(400).json({
        success: false,
        message: "Delivery has already been rated"
      });
    }

    // Update delivery with rating
    const updatedDelivery = await DeliveryModel.findByIdAndUpdate(
      deliveryId,
      { rating, review: review || '' },
      { new: true }
    ).populate('deliveryPerson', 'name phone')
     .populate({
       path: 'order',
       populate: {
         path: 'user',
         select: 'name phone'
       }
     });

    return res.status(200).json({
      success: true,
      message: "Delivery rated successfully",
      delivery: updatedDelivery
    });

  } catch (error) {
    console.error("Error rating delivery:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function getDeliveryStats(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Check if user is a delivery person
    if (user.role !== 'Delivery') {
      return res.status(403).json({
        success: false,
        message: "Only delivery persons can access delivery stats"
      });
    }

    const [totalDeliveries, pendingDeliveries, acceptedDeliveries, pickedUpDeliveries, deliveredDeliveries, cancelledDeliveries] = await Promise.all([
      DeliveryModel.countDocuments({ deliveryPerson: user._id }),
      DeliveryModel.countDocuments({ deliveryPerson: user._id, status: 'Pending' }),
      DeliveryModel.countDocuments({ deliveryPerson: user._id, status: 'Accepted' }),
      DeliveryModel.countDocuments({ deliveryPerson: user._id, status: 'PickedUp' }),
      DeliveryModel.countDocuments({ deliveryPerson: user._id, status: 'Delivered' }),
      DeliveryModel.countDocuments({ deliveryPerson: user._id, status: 'Cancelled' })
    ]);

    // Calculate average rating
    const ratingResult = await DeliveryModel.aggregate([
      { $match: { deliveryPerson: user._id, rating: { $exists: true } } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);

    // Calculate total earnings
    const earningsResult = await DeliveryModel.aggregate([
      { $match: { deliveryPerson: user._id, status: 'Delivered' } },
      { $group: { _id: null, totalEarnings: { $sum: '$deliveryFee' } } }
    ]);

    const stats = {
      totalDeliveries,
      pendingDeliveries,
      acceptedDeliveries,
      pickedUpDeliveries,
      deliveredDeliveries,
      cancelledDeliveries,
      averageRating: ratingResult[0]?.averageRating || 0,
      totalEarnings: earningsResult[0]?.totalEarnings || 0
    };

    return res.status(200).json({
      success: true,
      message: "Delivery stats retrieved successfully",
      stats
    });

  } catch (error) {
    console.error("Error getting delivery stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/**
 * Update delivery partner's live location
 */
async function updateDeliveryLocation(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Check if user is a delivery person
    if (user.role !== 'Delivery') {
      return res.status(403).json({
        success: false,
        message: "Only delivery persons can update location"
      });
    }

    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude must be numbers"
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates"
      });
    }

    // Update delivery partner's location
    await UserModel.findByIdAndUpdate(user._id, {
      currentLocation: { lat, lng }
    });

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location: { lat, lng }
    });

  } catch (error) {
    console.error("Error updating delivery location:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/**
 * Get delivery partner's current location
 */
async function getDeliveryLocation(req: Request, res: Response) {
  try {
    const { deliveryPersonId } = req.params;

    if (!deliveryPersonId) {
      return res.status(400).json({
        success: false,
        message: "Delivery person ID is required"
      });
    }

    const deliveryPerson = await UserModel.findById(deliveryPersonId)
      .select('name phone currentLocation isBusy currentOrder');

    if (!deliveryPerson || deliveryPerson.role !== 'Delivery') {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location retrieved successfully",
      deliveryPerson: {
        _id: deliveryPerson._id,
        name: deliveryPerson.name,
        phone: deliveryPerson.phone,
        currentLocation: deliveryPerson.currentLocation,
        isBusy: deliveryPerson.isBusy
      }
    });

  } catch (error) {
    console.error("Error getting delivery location:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

export {
  createDelivery,
  getDeliveryById,
  updateDeliveryStatus,
  getDeliveriesForDeliveryPerson,
  rateDelivery,
  getDeliveryStats,
  updateDeliveryLocation,
  getDeliveryLocation
};

