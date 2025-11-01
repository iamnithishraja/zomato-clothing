import OrderModel from "../Models/orderModel";
import type { Types } from "mongoose";

/**
 * Generate unique order number
 * Format: ORD-STOREID-YYYYMMDD-SEQUENCE
 * Example: ORD-ABC123-20250122-001
 */
export async function generateOrderNumber(storeId: Types.ObjectId | string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const storeIdShort = storeId.toString().slice(-6).toUpperCase();
  
  // Find the last order for this store today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const lastOrder = await OrderModel.findOne({
    store: storeId,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ createdAt: -1 });
  
  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    // Extract sequence number from last order
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 4 && parts[3]) {
      sequence = parseInt(parts[3]) + 1;
    }
  }
  
  const sequenceStr = sequence.toString().padStart(3, '0');
  return `ORD-${storeIdShort}-${dateStr}-${sequenceStr}`;
}

/**
 * Calculate delivery fee based on distance or order amount
 * This is a simple implementation - you can enhance it with real distance calculation
 */
export function calculateDeliveryFee(orderAmount: number, distance?: number): number {
  // If distance is provided, calculate based on distance
  if (distance) {
    const baseFee = 50;
    // ₹10 per km after first 2km
    return Math.round(baseFee + Math.max(0, (distance - 2) * 10));
  }
  
  // Tiered delivery fee based on order amount
  if (orderAmount >= 2000) {
    return 0; // Free delivery for orders above ₹2000
  } else if (orderAmount >= 1000) {
    return 30; // ₹30 for orders between ₹1000-1999
  } else if (orderAmount >= 500) {
    return 50; // ₹50 for orders between ₹500-999
  } else {
    return 70; // ₹70 for orders below ₹500
  }
}

/**
 * Reserve inventory for order items
 * This creates a temporary lock on inventory until payment is confirmed
 */
export async function reserveInventory(orderItems: any[]): Promise<boolean> {
  // In a real system, you'd update a separate "reserved" field
  // For now, we're directly decrementing availableQuantity in the order creation
  return true;
}

/**
 * Release inventory back if order fails or is cancelled
 */
export async function releaseInventory(orderItems: any[]): Promise<void> {
  const ProductModel = (await import("../Models/productModel")).default;
  
  for (const item of orderItems) {
    await ProductModel.findByIdAndUpdate(item.product, {
      $inc: { availableQuantity: item.quantity }
    });
  }
}


