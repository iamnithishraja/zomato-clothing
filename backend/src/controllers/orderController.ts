import OrderModel from "../Models/orderModel";
import ProductModel from "../Models/productModel";
import StoreModel from "../Models/storeModel";
import PaymentModel from "../Models/paymentModel";
import type { Response, Request } from "express";
import { validateUserRole, sendErrorResponse } from "../utils/validation";
import { generateOrderNumber, calculateDeliveryFee, releaseInventory } from "../utils/orderUtils";
import { notifyOrderPlaced } from "../utils/notificationUtils";
import z from "zod";
import type { Types } from "mongoose";

// Validation schema for order creation
const createOrderSchema = z.object({
  orderItems: z.array(z.object({
    product: z.string().min(1, "Product ID is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    price: z.number().min(0, "Price must be non-negative")
  })).min(1, "At least one order item is required"),
  shippingAddress: z.string().min(10, "Shipping address must be at least 10 characters"),
  paymentMethod: z.enum(["COD", "Online"], {
    message: "Payment method must be COD or Online"
  })
});

// Validation schema for order status update
const updateOrderStatusSchema = z.object({
  status: z.enum(["Pending", "Accepted", "Rejected", "Processing", "ReadyForPickup", "Shipped", "Delivered", "Cancelled"], {
    message: "Invalid order status"
  }),
  cancellationReason: z.string().optional()
});

async function createOrder(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;

    // Check if user is a customer
    if (!validateUserRole(user, res)) return;

    // Validate request body
    const validatedData = createOrderSchema.parse(req.body);
    const { orderItems, shippingAddress, paymentMethod } = validatedData;

    // Calculate total amount and validate product availability
    let itemsTotal = 0;
    let storeId: any = null;
    const validatedOrderItems: any[] = [];

    // Check all products and quantities up front and ensure all from the same store
    for (const item of orderItems) {
      const product = await ProductModel.findById(item.product);
      if (!product) {
        return sendErrorResponse(res, 404, `Product not found: ${item.product}`);
      }

      if (!product.isActive) {
        return sendErrorResponse(res, 400, `Product is not available: ${product.name}`);
      }

      // Set storeId from the first product (all products should be from same store)
      if (storeId === null) {
        storeId = product.storeId;
      } else if (product.storeId.toString() !== storeId.toString()) {
        return sendErrorResponse(res, 400, "All products must be from the same store for a single order");
      }

      if (product.availableQuantity < item.quantity) {
        return sendErrorResponse(res, 400, `Insufficient stock for product: ${product.name}. Available: ${product.availableQuantity}`);
      }

      // Use current product price
      const itemTotal = item.quantity * product.price;
      itemsTotal += itemTotal;

      validatedOrderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Verify store exists and is active
    const store = await StoreModel.findById(storeId);
    if (!store || !store.isActive) {
      return sendErrorResponse(res, 400, "Store is not available");
    }

    if (!storeId) {
      return sendErrorResponse(res, 400, "Store ID is required");
    }

    // Calculate delivery fee
    const deliveryFee = calculateDeliveryFee(itemsTotal);

    // Calculate total amount
    const totalAmount = itemsTotal + deliveryFee;

    // Generate unique order number
    const orderNumber = await generateOrderNumber(storeId);

    // To help avoid race conditions where multiple orders could oversell inventory,
    // we should update stocks with an atomic check. We'll use update with $inc + a filter.

    // For each product: try to decrement quantity, but only if enough are available.
    for (const item of validatedOrderItems) {
      const productUpdate = await ProductModel.findOneAndUpdate(
        { _id: item.product, availableQuantity: { $gte: item.quantity } },
        { $inc: { availableQuantity: -item.quantity } },
        { new: true }
      );
      if (!productUpdate) {
        // Rollback previous decrements
        for (const prevItem of validatedOrderItems) {
          if (prevItem.product.equals(item.product)) break;
          await ProductModel.findByIdAndUpdate(prevItem.product, { $inc: { availableQuantity: prevItem.quantity } });
        }
        return sendErrorResponse(res, 400, `Failed to reserve stock for product: ${item.product}`);
      }
    }

    // Now create order
    const order = new OrderModel({
      orderNumber,
      user: user._id,
      store: storeId,
      orderItems: validatedOrderItems,
      itemsTotal,
      deliveryFee,
      totalAmount,
      shippingAddress: shippingAddress.trim(),
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
      statusHistory: [{
        status: "Pending",
        timestamp: new Date(),
        updatedBy: user._id,
        note: "Order created"
      }]
    });

    // Save with retry on duplicate orderNumber
    {
      let attempts = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          await order.save();
          break;
        } catch (e: any) {
          if (e && e.code === 11000 && e.keyPattern && e.keyPattern.orderNumber) {
            // Regenerate and retry a few times
            if (++attempts > 3) throw e;
            const newOrderNumber = await generateOrderNumber(storeId);
            order.orderNumber = newOrderNumber;
            continue;
          }
          throw e;
        }
      }
    }

    // Create payment record for COD
    if (paymentMethod === "COD") {
      const payment = new PaymentModel({
        order: order._id,
        user: user._id,
        store: storeId,
        amount: totalAmount,
        paymentMethod: "COD",
        paymentStatus: "Pending"
      });
      await payment.save();
      order.paymentId = payment._id as any;
      await order.save();
    }

    // Send notifications
    await notifyOrderPlaced(
      order._id,
      orderNumber,
      user._id,
      store.merchantId,
      store._id,
      store.storeName,
      totalAmount
    );

    // Populate order details for response
    const populatedOrder = await OrderModel.findById(order._id)
      .populate('user', 'name phone email')
      .populate('store', 'storeName address')
      .populate('orderItems.product', 'name images price');

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder,
      requiresPayment: paymentMethod === "Online"
    });

  } catch (error) {
    console.error("Error creating order:", error);

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

async function getOrderById(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await OrderModel.findById(orderId)
      .populate('user', 'name phone email')
      .populate('store', 'storeName address storeImages')
      .populate('orderItems.product', 'name images price category subcategory');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if user has permission to view this order
    const orderUserId = typeof order.user === 'object' ? (order.user as any)._id : order.user;
    const orderStoreId = typeof order.store === 'object' ? (order.store as any)._id : order.store;

    if (user.role === 'User' && orderUserId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders"
      });
    }

    if (user.role === 'Merchant') {
      const store = await StoreModel.findOne({ merchantId: user._id });
      if (!store || orderStoreId.toString() !== store._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view orders from your store"
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      order
    });

  } catch (error) {
    console.error("Error getting order:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

async function getOrdersForUser(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const paymentStatus = req.query.paymentStatus as string;

    // Build filter object based on user role
    let filter: any = {};

    if (user.role === 'User') {
      filter.user = user._id;
    } else if (user.role === 'Merchant') {
      const store = await StoreModel.findOne({ merchantId: user._id });
      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found for this merchant"
        });
      }
      filter.store = store._id;
    } else if (user.role === 'Delivery') {
      filter.deliveryPerson = user._id;
    }

    // Add status filters
    if (status) {
      filter.status = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get orders with pagination
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name phone email')
      .populate('store', 'storeName address')
      .populate('orderItems.product', 'name images price');

    // Get total count for pagination
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
    console.error("Error getting orders:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

async function updateOrderStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    // Validate request body
    const validatedData = updateOrderStatusSchema.parse(req.body);
    const { status, cancellationReason } = validatedData;

    // Find the order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check permissions based on user role
    const orderUserId = typeof order.user === 'object' ? (order.user as any)._id : order.user;
    const orderStoreId = typeof order.store === 'object' ? (order.store as any)._id : order.store;

    if (user.role === 'User') {
      if (orderUserId.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only update your own orders"
        });
      }
      // Users can only cancel their own orders
      if (status !== 'Cancelled') {
        return res.status(403).json({
          success: false,
          message: "You can only cancel orders"
        });
      }
    } else if (user.role === 'Merchant') {
      const store = await StoreModel.findOne({ merchantId: user._id });
      if (!store || orderStoreId.toString() !== store._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only update orders from your store"
        });
      }
    } else if (user.role === 'Delivery') {
      // Delivery persons can update delivery-related statuses
      if (!['Shipped', 'Delivered'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: "You can only update delivery statuses"
        });
      }
    }

    // Validate status transitions
    const validTransitions: { [key: string]: string[] } = {
      'Pending': ['Accepted', 'Rejected', 'Cancelled'],
      'Accepted': ['Processing', 'Cancelled'],
      'Rejected': [],
      'Processing': ['ReadyForPickup', 'Cancelled'],
      'ReadyForPickup': ['Shipped', 'Cancelled'],
      'Shipped': ['Delivered', 'Cancelled'],
      'Delivered': [],
      'Cancelled': []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // Update order with status history
    const updateData: any = {
      status,
      $push: {
        statusHistory: {
          status,
          timestamp: new Date(),
          updatedBy: user._id,
          note: cancellationReason || `Status updated to ${status}`
        }
      }
    };

    if (status === 'Cancelled') {
      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
      updateData.cancelledAt = new Date();

      // Release inventory on cancellation
      await releaseInventory(order.orderItems);
    }

    if (status === 'Delivered') {
      updateData.deliveryDate = new Date();
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate('user', 'name phone email')
     .populate('store', 'storeName address')
     .populate('orderItems.product', 'name images price');

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error updating order status:", error);

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

async function getOrderStats(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    let stats: any = {};

    if (user.role === 'User') {
      // Customer stats
      const [totalOrders, pendingOrders, deliveredOrders, cancelledOrders] = await Promise.all([
        OrderModel.countDocuments({ user: user._id }),
        OrderModel.countDocuments({ user: user._id, status: 'Pending' }),
        OrderModel.countDocuments({ user: user._id, status: 'Delivered' }),
        OrderModel.countDocuments({ user: user._id, status: 'Cancelled' })
      ]);

      stats = {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders
      };
    } else if (user.role === 'Merchant') {
      // Merchant stats
      const store = await StoreModel.findOne({ merchantId: user._id });
      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found for this merchant"
        });
      }

      const [totalOrders, pendingOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders] = await Promise.all([
        OrderModel.countDocuments({ store: store._id }),
        OrderModel.countDocuments({ store: store._id, status: 'Pending' }),
        OrderModel.countDocuments({ store: store._id, status: 'Processing' }),
        OrderModel.countDocuments({ store: store._id, status: 'Shipped' }),
        OrderModel.countDocuments({ store: store._id, status: 'Delivered' }),
        OrderModel.countDocuments({ store: store._id, status: 'Cancelled' })
      ]);

      // Calculate total revenue
      const revenueResult = await OrderModel.aggregate([
        { $match: { store: store._id, status: 'Delivered' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]);

      stats = {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: revenueResult[0]?.totalRevenue || 0
      };
    }

    return res.status(200).json({
      success: true,
      message: "Order stats retrieved successfully",
      stats
    });

  } catch (error) {
    console.error("Error getting order stats:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

// Create multiple orders for different stores
async function createMultipleOrders(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;

    // Check if user is a customer
    if (!validateUserRole(user, res)) return;

    // Validate request body - array of orders
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return sendErrorResponse(res, 400, "Orders array is required and must not be empty");
    }

    const createdOrders = [];
    const errors = [];

    // Process each order
    for (let i = 0; i < orders.length; i++) {
      try {
        const orderData = orders[i];

        // Validate each order
        const validatedData = createOrderSchema.parse(orderData);
        const { orderItems, shippingAddress, paymentMethod } = validatedData;

        let itemsTotal = 0;
        let storeId: any = null;
        const validatedOrderItems: any[] = [];

        for (const item of orderItems) {
          const product = await ProductModel.findById(item.product);
          if (!product) {
            throw new Error(`Product not found: ${item.product}`);
          }

          if (!product.isActive) {
            throw new Error(`Product is not available: ${product.name}`);
          }

          if (storeId === null) {
            storeId = product.storeId;
          } else if (product.storeId.toString() !== storeId.toString()) {
            throw new Error("All products must be from the same store for a single order");
          }

          if (product.availableQuantity < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.availableQuantity}`);
          }

          const itemTotal = item.quantity * product.price;
          itemsTotal += itemTotal;

          validatedOrderItems.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price
          });
        }

        const store = await StoreModel.findById(storeId);
        if (!store || !store.isActive) {
          throw new Error("Store is not available");
        }

        // Calculate delivery fee and total amount as in single order
        const deliveryFee = calculateDeliveryFee(itemsTotal);
        const totalAmount = itemsTotal + deliveryFee;

        // Perform atomic stock update for all order items, fail all if any fails (simulate a "transaction")
        let stockOk = true;
        for (const item of validatedOrderItems) {
          const productUpdate = await ProductModel.findOneAndUpdate(
            { _id: item.product, availableQuantity: { $gte: item.quantity } },
            { $inc: { availableQuantity: -item.quantity } },
            { new: true }
          );
          if (!productUpdate) {
            stockOk = false;
            break;
          }
        }
        if (!stockOk) {
          // Try to rollback any decremented stock just in case.
          for (const rollbackItem of validatedOrderItems) {
            await ProductModel.findByIdAndUpdate(
              rollbackItem.product,
              { $inc: { availableQuantity: rollbackItem.quantity } }
            );
          }
          throw new Error(`Failed to reserve stock for some products in order index ${i}`);
        }

        // Generate order number per store
        const orderNumber = await generateOrderNumber(storeId);

        // Create order
        const order = new OrderModel({
          orderNumber,
          user: user._id,
          store: storeId,
          orderItems: validatedOrderItems,
          itemsTotal,
          deliveryFee,
          totalAmount,
          shippingAddress: shippingAddress.trim(),
          paymentMethod,
          statusHistory: [{
            status: "Pending",
            timestamp: new Date(),
            updatedBy: user._id,
            note: "Order created"
          }]
        });
        // Save with retry on duplicate orderNumber
        {
          let attempts = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            try {
              await order.save();
              break;
            } catch (e: any) {
              if (e && e.code === 11000 && e.keyPattern && e.keyPattern.orderNumber) {
                if (++attempts > 3) throw e;
                const newOrderNumber = await generateOrderNumber(storeId);
                order.orderNumber = newOrderNumber;
                continue;
              }
              throw e;
            }
          }
        }

        // Create payment record for COD in batch-created orders as well!
        if (paymentMethod === "COD") {
          const payment = new PaymentModel({
            order: order._id,
            user: user._id,
            store: storeId,
            amount: totalAmount,
            paymentMethod: "COD",
            paymentStatus: "Pending"
          });
          await payment.save();
          order.paymentId = payment._id as any;
          await order.save();
        }

        // Populate order details for response
        const populatedOrder = await OrderModel.findById(order._id)
          .populate('user', 'name phone email')
          .populate('store', 'storeName address')
          .populate('orderItems.product', 'name images price');

        createdOrders.push(populatedOrder);

      } catch (error) {
        console.error(`Error creating order ${i + 1}:`, error);
        errors.push({
          orderIndex: i,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Return response
    if (createdOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No orders were created successfully",
        errors
      });
    }

    return res.status(201).json({
      success: true,
      message: `${createdOrders.length} order${createdOrders.length > 1 ? 's' : ''} created successfully`,
      orders: createdOrders,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error creating multiple orders:", error);

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

export { 
  createOrder, 
  createMultipleOrders,
  getOrderById, 
  getOrdersForUser, 
  updateOrderStatus,
  getOrderStats
};
