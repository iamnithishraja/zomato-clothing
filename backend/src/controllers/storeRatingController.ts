import type { Request, Response } from "express";
import StoreModel from "../Models/storeModel";
import OrderModel from "../Models/orderModel";
import { sendErrorResponse } from "../utils/validation";
import z from "zod";

// Store rating schema
const rateStoreSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  review: z.string().max(1000, "Review must be less than 1000 characters").optional()
});

/**
 * Rate a store after order delivery
 */
export async function rateStore(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    // Validate request
    const validatedData = rateStoreSchema.parse(req.body);
    const { orderId, rating, review } = validatedData;

    // Find the order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Check if user owns the order
    if (order.user.toString() !== user._id.toString()) {
      return sendErrorResponse(res, 403, "You can only rate your own orders");
    }

    // Check if order is delivered
    if (order.status !== "Delivered") {
      return sendErrorResponse(res, 400, "You can only rate delivered orders");
    }

    // Find the store
    const store = await StoreModel.findById(order.store);
    if (!store) {
      return sendErrorResponse(res, 404, "Store not found");
    }

    // Update store rating
    const currentTotal = (store.rating?.average || 0) * (store.rating?.totalReviews || 0);
    const newTotal = currentTotal + rating;
    const newCount = (store.rating?.totalReviews || 0) + 1;
    
    if (!store.rating) {
      store.rating = { average: 0, totalReviews: 0 };
    }
    store.rating.average = newTotal / newCount;
    store.rating.totalReviews = newCount;
    await store.save();

    return res.status(200).json({
      success: true,
      message: "Store rated successfully",
      storeRating: {
        average: store.rating.average,
        totalReviews: store.rating.totalReviews
      }
    });

  } catch (error) {
    console.error("Error rating store:", error);
    
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

    return sendErrorResponse(res, 500, "Internal server error");
  }
}

/**
 * Get store ratings and reviews
 */
export async function getStoreRatings(req: Request, res: Response) {
  try {
    const { storeId } = req.params;

    const store = await StoreModel.findById(storeId);
    if (!store) {
      return sendErrorResponse(res, 404, "Store not found");
    }

    return res.status(200).json({
      success: true,
      message: "Store ratings retrieved successfully",
      rating: store.rating
    });

  } catch (error) {
    console.error("Error getting store ratings:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

