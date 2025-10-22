import type { Request, Response } from "express";
import OrderModel from "../Models/orderModel";
import PaymentModel from "../Models/paymentModel";
import StoreModel from "../Models/storeModel";
import { sendErrorResponse } from "../utils/validation";

/**
 * Get merchant's settlement/payout report
 */
export async function getSettlementReport(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (user.role !== "Merchant") {
      return sendErrorResponse(res, 403, "Only merchants can access settlement reports");
    }

    // Find merchant's store
    const store = await StoreModel.findOne({ merchantId: user._id });
    if (!store) {
      return sendErrorResponse(res, 404, "Store not found for this merchant");
    }

    // Get query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    // Get all delivered orders in the date range
    const deliveredOrders = await OrderModel.find({
      store: store._id,
      status: "Delivered",
      deliveryDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate("user", "name phone");

    // Calculate totals
    const totalOrders = deliveredOrders.length;
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItemsValue = deliveredOrders.reduce((sum, order) => sum + order.itemsTotal, 0);
    const totalDeliveryFees = deliveredOrders.reduce((sum, order) => sum + order.deliveryFee, 0);

    // Get payment breakdown
    const codOrders = deliveredOrders.filter(o => o.paymentMethod === "COD");
    const onlineOrders = deliveredOrders.filter(o => o.paymentMethod === "Online");

    const codRevenue = codOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const onlineRevenue = onlineOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Get COD collection status
    const codPayments = await PaymentModel.find({
      store: store._id,
      paymentMethod: "COD",
      codCollectedAt: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const codCollected = codPayments.filter(p => p.codSubmittedToStore).length;
    const codPending = codPayments.filter(p => !p.codSubmittedToStore).length;
    const codCollectedAmount = codPayments
      .filter(p => p.codSubmittedToStore)
      .reduce((sum, p) => sum + p.amount, 0);
    const codPendingAmount = codPayments
      .filter(p => !p.codSubmittedToStore)
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate payout (simplified - in reality would include platform fees, taxes, etc.)
    const platformFeePercentage = 5; // 5% platform fee
    const platformFee = (totalItemsValue * platformFeePercentage) / 100;
    const netPayout = totalItemsValue - platformFee;

    return res.status(200).json({
      success: true,
      message: "Settlement report retrieved successfully",
      report: {
        period: {
          startDate,
          endDate
        },
        summary: {
          totalOrders,
          totalRevenue,
          totalItemsValue,
          totalDeliveryFees,
          platformFee,
          netPayout
        },
        paymentBreakdown: {
          cod: {
            orders: codOrders.length,
            revenue: codRevenue,
            collected: codCollected,
            collectedAmount: codCollectedAmount,
            pending: codPending,
            pendingAmount: codPendingAmount
          },
          online: {
            orders: onlineOrders.length,
            revenue: onlineRevenue
          }
        },
        orders: deliveredOrders.map(order => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          deliveryDate: order.deliveryDate,
          customer: order.user,
          itemsTotal: order.itemsTotal,
          deliveryFee: order.deliveryFee,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus
        }))
      }
    });

  } catch (error) {
    console.error("Error getting settlement report:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

/**
 * Get payout summary for a specific period
 */
export async function getPayoutSummary(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (user.role !== "Merchant") {
      return sendErrorResponse(res, 403, "Only merchants can access payout summary");
    }

    // Find merchant's store
    const store = await StoreModel.findOne({ merchantId: user._id });
    if (!store) {
      return sendErrorResponse(res, 404, "Store not found for this merchant");
    }

    // Get payments with payout information
    const payments = await PaymentModel.find({
      store: store._id,
      paymentStatus: "Completed"
    });

    const totalPayouts = payments.filter(p => p.payoutStatus === "Completed").length;
    const totalPayoutAmount = payments
      .filter(p => p.payoutStatus === "Completed")
      .reduce((sum, p) => sum + (p.payoutAmount || 0), 0);

    const pendingPayouts = payments.filter(p => p.payoutStatus === "Pending").length;
    const pendingPayoutAmount = payments
      .filter(p => p.payoutStatus === "Pending")
      .reduce((sum, p) => sum + p.amount, 0);

    return res.status(200).json({
      success: true,
      message: "Payout summary retrieved successfully",
      summary: {
        completed: {
          count: totalPayouts,
          amount: totalPayoutAmount
        },
        pending: {
          count: pendingPayouts,
          amount: pendingPayoutAmount
        }
      }
    });

  } catch (error) {
    console.error("Error getting payout summary:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

