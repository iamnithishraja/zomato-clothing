import DeliveryModel from "../Models/deliveryModel";
import UserModel from "../Models/userModel";
import { calculateDistance } from "../utils/locationUtils";
import { isVerificationApproved } from "../utils/verificationUtils";
import { notifyDeliveryAssigned } from "../utils/notificationUtils";

/**
 * Assign a return delivery to the nearest available delivery partner.
 * Does not modify the original order status.
 */
export async function assignReturnDelivery(
  deliveryId: string,
  order: {
    _id: any;
    orderNumber?: string;
    user: any;
    store?: any;
    deliveryLocation?: { lat?: number; lng?: number };
    pickupLocation?: { lat?: number; lng?: number };
  }
): Promise<boolean> {
  try {
    const delivery = await DeliveryModel.findById(deliveryId);
    if (!delivery || delivery.deliveryType !== "RETURN") {
      return false;
    }

    if (delivery.status !== "Pending" || delivery.deliveryPerson) {
      return false;
    }

    let pickupLat: number | null = null;
    let pickupLng: number | null = null;

    if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
      pickupLat = order.deliveryLocation.lat;
      pickupLng = order.deliveryLocation.lng;
    }

    const availablePartners = (await UserModel.find({
      role: "Delivery",
      isActive: true,
      isBusy: false,
    }).lean()).filter((partner) => isVerificationApproved(partner));

    if (availablePartners.length === 0) {
      console.log(`⚠️ [Return Assignment] No delivery partners available for return ${deliveryId}`);
      return false;
    }

    let selectedPartner: any = null;
    let minDistance = Infinity;

    for (const partner of availablePartners) {
      const partnerStatus = await UserModel.findById(partner._id).select("isBusy").lean();
      if (partnerStatus?.isBusy) continue;

      const activeDelivery = await DeliveryModel.findOne({
        deliveryPerson: partner._id,
        status: { $in: ["Pending", "Accepted", "PickedUp", "OnTheWay"] },
      });
      if (activeDelivery) continue;

      if (!partner.currentLocation?.lat || !partner.currentLocation?.lng) continue;

      const distance =
        pickupLat && pickupLng
          ? calculateDistance(
              pickupLat,
              pickupLng,
              partner.currentLocation.lat,
              partner.currentLocation.lng
            )
          : Math.sqrt(
              Math.pow(partner.currentLocation.lat, 2) + Math.pow(partner.currentLocation.lng, 2)
            );

      if (distance < minDistance) {
        minDistance = distance;
        selectedPartner = partner;
      }
    }

    if (!selectedPartner) {
      for (const partner of availablePartners) {
        const partnerStatus = await UserModel.findById(partner._id).select("isBusy").lean();
        if (!partnerStatus?.isBusy) {
          selectedPartner = partner;
          break;
        }
      }
    }

    if (!selectedPartner) {
      return false;
    }

    const assignedDelivery = await DeliveryModel.findOneAndUpdate(
      {
        _id: deliveryId,
        deliveryType: "RETURN",
        status: "Pending",
        $or: [{ deliveryPerson: { $exists: false } }, { deliveryPerson: null }],
      },
      { deliveryPerson: selectedPartner._id },
      { returnDocument: "after" }
    );

    if (!assignedDelivery) {
      console.log(`⚠️ [Return Assignment] Return ${deliveryId} was already assigned`);
      return false;
    }

    const partnerDoc = await UserModel.findOneAndUpdate(
      {
        _id: selectedPartner._id,
        role: "Delivery",
        isActive: true,
        isBusy: false,
      },
      {
        isBusy: true,
        currentOrder: order._id,
      },
      { returnDocument: "after" }
    );

    if (!partnerDoc) {
      await DeliveryModel.findByIdAndUpdate(deliveryId, {
        $unset: { deliveryPerson: 1 },
      });
      console.log(`⚠️ [Return Assignment] Partner ${selectedPartner._id} no longer available, rolled back`);
      return false;
    }

    try {
      const store = order.store as any;
      await notifyDeliveryAssigned(
        order._id,
        order.orderNumber || order._id.toString().slice(-8),
        order.user,
        selectedPartner._id,
        selectedPartner.name || "Delivery Partner",
        store?._id
      );
    } catch (e) {
      console.error("[Return Assignment] Failed to send notification", e);
    }

    console.log(
      `✅ [Return Assignment] Assigned return delivery ${deliveryId} to ${selectedPartner.name}`
    );
    return true;
  } catch (error) {
    console.error("[Return Assignment] Error:", error);
    return false;
  }
}

/**
 * Reassign a cancelled/rejected return delivery to another partner.
 */
export async function reassignReturnDelivery(deliveryId: string): Promise<boolean> {
  const delivery = await DeliveryModel.findById(deliveryId).populate({
    path: "order",
    populate: [{ path: "user" }, { path: "store" }],
  });

  if (!delivery || delivery.deliveryType !== "RETURN" || !delivery.order) {
    return false;
  }

  await DeliveryModel.findByIdAndUpdate(deliveryId, {
    $unset: { deliveryPerson: 1, cancellationReason: 1 },
    status: 'Pending',
  });

  return assignReturnDelivery(deliveryId, delivery.order as any);
}

/**
 * Find return deliveries waiting for a delivery partner and assign them.
 */
export async function processUnassignedReturnDeliveries(): Promise<void> {
  try {
    const pendingReturns = await DeliveryModel.find({
      deliveryType: "RETURN",
      status: "Pending",
      $or: [{ deliveryPerson: { $exists: false } }, { deliveryPerson: null }],
    })
      .populate({
        path: "order",
        populate: [{ path: "user" }, { path: "store" }],
      })
      .limit(20);

    if (pendingReturns.length === 0) return;

    console.log(
      `🔄 [Return Assignment] Found ${pendingReturns.length} unassigned return delivery(s)`
    );

    for (const delivery of pendingReturns) {
      if (delivery.order) {
        await assignReturnDelivery(delivery._id.toString(), delivery.order as any);
      }
    }
  } catch (error) {
    console.error("[Return Assignment] Error processing unassigned returns:", error);
  }
}
