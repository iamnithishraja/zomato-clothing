import NotificationModel from "../Models/notificationModel";
import type { Types } from "mongoose";

export interface NotificationData {
  recipient: Types.ObjectId | string;
  recipientRole: "User" | "Merchant" | "Delivery";
  type: "ORDER_PLACED" | "ORDER_ACCEPTED" | "ORDER_REJECTED" | "ORDER_READY" | "ORDER_PICKED" | "ORDER_DELIVERED" | "ORDER_CANCELLED" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "DELIVERY_ASSIGNED" | "RATING_RECEIVED" | "GENERAL";
  title: string;
  message: string;
  order?: Types.ObjectId | string;
  store?: Types.ObjectId | string;
  delivery?: Types.ObjectId | string;
  actionUrl?: string;
  actionLabel?: string;
  data?: any;
}

/**
 * Send notification to a user
 */
export async function sendNotification(notificationData: NotificationData): Promise<void> {
  try {
    const notification = new NotificationModel(notificationData);
    await notification.save();
    
    // TODO: Send push notification via FCM/APNS
    // TODO: Send SMS/Email if enabled
    
    console.log(`Notification sent to ${notificationData.recipient}: ${notificationData.title}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

/**
 * Send notifications for order placed
 */
export async function notifyOrderPlaced(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  merchantId: Types.ObjectId | string,
  storeId: Types.ObjectId | string,
  storeName: string,
  orderAmount: number
): Promise<void> {
  // Notify customer
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "ORDER_PLACED",
    title: "Order Placed Successfully!",
    message: `Your order #${orderNumber} worth ₹${orderAmount} has been placed at ${storeName}.`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}`,
    actionLabel: "View Order"
  });
  
  // Notify merchant
  await sendNotification({
    recipient: merchantId,
    recipientRole: "Merchant",
    type: "ORDER_PLACED",
    title: "New Order Received!",
    message: `You have received a new order #${orderNumber} worth ₹${orderAmount}.`,
    order: orderId,
    store: storeId,
    actionUrl: `/merchant/orders/${orderId}`,
    actionLabel: "View Order"
  });
}

/**
 * Send notifications for order accepted
 */
export async function notifyOrderAccepted(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  storeId: Types.ObjectId | string,
  storeName: string
): Promise<void> {
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "ORDER_ACCEPTED",
    title: "Order Accepted!",
    message: `Your order #${orderNumber} has been accepted by ${storeName} and is being prepared.`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}`,
    actionLabel: "Track Order"
  });
}

/**
 * Send notifications for order rejected
 */
export async function notifyOrderRejected(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  storeId: Types.ObjectId | string,
  storeName: string,
  reason: string
): Promise<void> {
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "ORDER_REJECTED",
    title: "Order Rejected",
    message: `Your order #${orderNumber} was rejected by ${storeName}. Reason: ${reason}`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}`,
    actionLabel: "View Details"
  });
}

/**
 * Send notifications for order ready for pickup
 */
export async function notifyOrderReady(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  storeId: Types.ObjectId | string,
  storeName: string
): Promise<void> {
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "ORDER_READY",
    title: "Order Ready for Pickup!",
    message: `Your order #${orderNumber} is ready and waiting for pickup from ${storeName}.`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}`,
    actionLabel: "Track Order"
  });
}

/**
 * Send notifications for delivery assigned
 */
export async function notifyDeliveryAssigned(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  deliveryPersonId: Types.ObjectId | string,
  deliveryPersonName: string,
  storeId: Types.ObjectId | string
): Promise<void> {
  // Notify customer
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "DELIVERY_ASSIGNED",
    title: "Delivery Partner Assigned!",
    message: `${deliveryPersonName} will deliver your order #${orderNumber}.`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}`,
    actionLabel: "Track Delivery"
  });
  
  // Notify delivery person
  await sendNotification({
    recipient: deliveryPersonId,
    recipientRole: "Delivery",
    type: "DELIVERY_ASSIGNED",
    title: "New Delivery Assignment!",
    message: `You have been assigned to deliver order #${orderNumber}.`,
    order: orderId,
    store: storeId,
    actionUrl: `/delivery/orders/${orderId}`,
    actionLabel: "View Order"
  });
}

/**
 * Send notifications for order picked up
 */
export async function notifyOrderPickedUp(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  deliveryPersonName: string,
  storeId: Types.ObjectId | string
): Promise<void> {
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "ORDER_PICKED",
    title: "Order Picked Up!",
    message: `${deliveryPersonName} has picked up your order #${orderNumber} and is on the way.`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}`,
    actionLabel: "Track Live"
  });
}

/**
 * Send notifications for order delivered
 */
export async function notifyOrderDelivered(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  storeId: Types.ObjectId | string
): Promise<void> {
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "ORDER_DELIVERED",
    title: "Order Delivered!",
    message: `Your order #${orderNumber} has been delivered successfully. Enjoy your purchase!`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}/rate`,
    actionLabel: "Rate Order"
  });
}

/**
 * Send notifications for payment success
 */
export async function notifyPaymentSuccess(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  amount: number,
  storeId: Types.ObjectId | string
): Promise<void> {
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "PAYMENT_SUCCESS",
    title: "Payment Successful!",
    message: `Your payment of ₹${amount} for order #${orderNumber} was successful.`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}`,
    actionLabel: "View Order"
  });
}

/**
 * Send notifications for payment failed
 */
export async function notifyPaymentFailed(
  orderId: Types.ObjectId | string,
  orderNumber: string,
  userId: Types.ObjectId | string,
  amount: number,
  storeId: Types.ObjectId | string
): Promise<void> {
  await sendNotification({
    recipient: userId,
    recipientRole: "User",
    type: "PAYMENT_FAILED",
    title: "Payment Failed",
    message: `Your payment of ₹${amount} for order #${orderNumber} failed. Please try again.`,
    order: orderId,
    store: storeId,
    actionUrl: `/order/${orderId}/payment`,
    actionLabel: "Retry Payment"
  });
}


