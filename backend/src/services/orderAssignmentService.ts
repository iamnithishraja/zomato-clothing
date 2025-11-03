/**
 * Order Assignment Service
 * Handles automatic assignment of orders to delivery partners
 * Runs periodically to check for unassigned orders and assign them to available delivery partners
 */

import { Types } from 'mongoose';
import OrderModel from '../Models/orderModel';
import UserModel from '../Models/userModel';
import DeliveryModel from '../Models/deliveryModel';
import StoreModel from '../Models/storeModel';
import { notifyDeliveryAssigned } from '../utils/notificationUtils';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Auto-assign orders that are ready for pickup but don't have delivery partner assigned
 * This function is called periodically by the background job
 */
export async function processUnassignedOrders(): Promise<void> {
  try {
    console.log('🔄 [Assignment Service] Checking for unassigned orders...');

    // Find all orders that are:
    // 1. In "ReadyForPickup" status
    // 2. Don't have a delivery person assigned
    // 3. Are not cancelled
    const unassignedOrders = await OrderModel.find({
      status: 'ReadyForPickup',
      deliveryPerson: { $exists: false }
    })
      .populate('store', 'address storeName')
      .populate('user', '_id name')
      .sort({ createdAt: 1 }) // Oldest orders first
      .limit(50); // Process max 50 orders per run to avoid overload

    if (unassignedOrders.length === 0) {
      console.log('✅ [Assignment Service] No unassigned orders found');
      return;
    }

    console.log(`📦 [Assignment Service] Found ${unassignedOrders.length} unassigned order(s)`);

    // Find available delivery partners (not busy and active)
    const availableDeliveryPartners = await UserModel.find({
      role: 'Delivery',
      isActive: true,
      isBusy: false
    }).lean();

    if (availableDeliveryPartners.length === 0) {
      console.log('⚠️ [Assignment Service] No delivery partners available');
      return;
    }

    console.log(`👥 [Assignment Service] Found ${availableDeliveryPartners.length} available delivery partner(s)`);

    let assignedCount = 0;
    let failedCount = 0;

    // Process each unassigned order
    for (const order of unassignedOrders) {
      try {
        // Get store information
        const store = order.store as any;

        // Get pickup location
        let pickupLat: number | null = null;
        let pickupLng: number | null = null;

        if (order.pickupLocation?.lat && order.pickupLocation?.lng) {
          pickupLat = order.pickupLocation.lat;
          pickupLng = order.pickupLocation.lng;
        }

        // Find nearest available delivery partner
        let selectedDeliveryPartner: any = null;
        let minDistance = Infinity;

        if (pickupLat && pickupLng) {
          // Find nearest delivery partner within 5km radius
          for (const partner of availableDeliveryPartners) {
            // Check if partner is still available (not assigned in this batch)
            const partnerStatus = await UserModel.findById(partner._id).select('isBusy').lean();
            if (partnerStatus?.isBusy) {
              continue; // Skip if already assigned
            }

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

          // If no partner found within 5km, check if order is older than 15 minutes
          // Then expand search radius to 10km
          if (!selectedDeliveryPartner) {
            const orderAge = Date.now() - order.createdAt.getTime();
            const fifteenMinutes = 15 * 60 * 1000;

            if (orderAge > fifteenMinutes) {
              console.log(`⏰ [Assignment Service] Order ${order._id} is older than 15 minutes, expanding radius to 10km`);

              for (const partner of availableDeliveryPartners) {
                const partnerStatus = await UserModel.findById(partner._id).select('isBusy').lean();
                if (partnerStatus?.isBusy) continue;

                if (partner.currentLocation?.lat && partner.currentLocation?.lng) {
                  const distance = calculateDistance(
                    pickupLat,
                    pickupLng,
                    partner.currentLocation.lat,
                    partner.currentLocation.lng
                  );

                  if (distance <= 10 && distance < minDistance) {
                    minDistance = distance;
                    selectedDeliveryPartner = partner;
                  }
                }
              }
            }
          }
        } else {
          // No location data, assign randomly from available partners
          console.log(`📍 [Assignment Service] No pickup location for order ${order._id}, assigning randomly`);
          
          // Filter still available partners
          const stillAvailable = [];
          for (const partner of availableDeliveryPartners) {
            const partnerStatus = await UserModel.findById(partner._id).select('isBusy').lean();
            if (!partnerStatus?.isBusy) {
              stillAvailable.push(partner);
            }
          }

          if (stillAvailable.length > 0) {
            selectedDeliveryPartner = stillAvailable[Math.floor(Math.random() * stillAvailable.length)];
          }
        }

        // If a delivery partner was found, assign the order
        if (selectedDeliveryPartner) {
          // Assign delivery partner to order
          order.deliveryPerson = selectedDeliveryPartner._id as any;
          order.status = 'Assigned';
          order.statusHistory.push({
            status: 'Assigned',
            timestamp: new Date(),
            note: `Auto-assigned to ${selectedDeliveryPartner.name || 'Unknown'}${minDistance !== Infinity ? ` (${minDistance.toFixed(2)}km away)` : ''} by background service`
          });
          await order.save();

          // Mark delivery partner as busy
          await UserModel.findByIdAndUpdate(selectedDeliveryPartner._id, {
            isBusy: true,
            currentOrder: order._id
          });

          // Create delivery record if not exists
          let delivery = await DeliveryModel.findOne({ order: order._id });
          
          if (!delivery) {
            delivery = new DeliveryModel({
              deliveryPerson: selectedDeliveryPartner._id,
              order: order._id,
              pickupAddress: store?.address || 'Store address',
              deliveryAddress: order.shippingAddress,
              estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
              deliveryFee: order.deliveryFee || 0,
              status: 'Pending'
            });
            await delivery.save();
          }

          // Send notification to delivery partner
          try {
            await notifyDeliveryAssigned(
              order._id,
              order.orderNumber || order._id.toString().slice(-8),
              order.user as any,
              selectedDeliveryPartner._id,
              selectedDeliveryPartner.name || 'Delivery Partner',
              store?._id
            );
          } catch (notifError) {
            console.error(`❌ [Assignment Service] Failed to send notification for order ${order._id}:`, notifError);
          }

          assignedCount++;
          console.log(`✅ [Assignment Service] Assigned order ${order._id} to ${selectedDeliveryPartner.name}${minDistance !== Infinity ? ` (${minDistance.toFixed(2)}km away)` : ''}`);
        } else {
          failedCount++;
          console.log(`❌ [Assignment Service] No suitable delivery partner found for order ${order._id}`);
        }
      } catch (orderError) {
        failedCount++;
        console.error(`❌ [Assignment Service] Error processing order ${order._id}:`, orderError);
      }
    }

    console.log(`🏁 [Assignment Service] Completed: ${assignedCount} assigned, ${failedCount} failed`);
  } catch (error) {
    console.error('❌ [Assignment Service] Error in processUnassignedOrders:', error);
  }
}

/**
 * Check for orders near a specific delivery partner who just came online
 * This is called when a delivery partner changes their online status
 */
export async function assignOrdersToNewlyOnlinePartner(deliveryPersonId: Types.ObjectId | string): Promise<number> {
  try {
    console.log(`🟢 [Assignment Service] Delivery partner ${deliveryPersonId} came online, checking for nearby orders...`);

    // Get delivery partner details
    const deliveryPerson = await UserModel.findById(deliveryPersonId).lean();
    
    if (!deliveryPerson || deliveryPerson.role !== 'Delivery' || !deliveryPerson.isActive || deliveryPerson.isBusy) {
      console.log(`⚠️ [Assignment Service] Delivery partner ${deliveryPersonId} is not eligible for assignment`);
      return 0;
    }

    // Check if partner has location
    if (!deliveryPerson.currentLocation?.lat || !deliveryPerson.currentLocation?.lng) {
      console.log(`⚠️ [Assignment Service] Delivery partner ${deliveryPersonId} has no location data`);
      return 0;
    }

    // Find unassigned orders
    const unassignedOrders = await OrderModel.find({
      status: 'ReadyForPickup',
      deliveryPerson: { $exists: false }
    })
      .populate('store', 'address storeName')
      .populate('user', '_id name')
      .sort({ createdAt: 1 }) // Oldest first
      .limit(10); // Check up to 10 orders

    if (unassignedOrders.length === 0) {
      console.log(`✅ [Assignment Service] No unassigned orders for newly online partner ${deliveryPersonId}`);
      return 0;
    }

    // Find nearest order within 5km
    let nearestOrder: any = null;
    let minDistance = Infinity;

    for (const order of unassignedOrders) {
      if (order.pickupLocation?.lat && order.pickupLocation?.lng) {
        const distance = calculateDistance(
          deliveryPerson.currentLocation.lat,
          deliveryPerson.currentLocation.lng,
          order.pickupLocation.lat,
          order.pickupLocation.lng
        );

        if (distance <= 5 && distance < minDistance) {
          minDistance = distance;
          nearestOrder = order;
        }
      }
    }

    // If found, assign the order
    if (nearestOrder) {
      const store = nearestOrder.store as any;

      nearestOrder.deliveryPerson = deliveryPerson._id as any;
      nearestOrder.status = 'Assigned';
      nearestOrder.statusHistory.push({
        status: 'Assigned',
        timestamp: new Date(),
        note: `Auto-assigned to ${deliveryPerson.name} (${minDistance.toFixed(2)}km away) when they came online`
      });
      await nearestOrder.save();

      // Mark delivery partner as busy
      await UserModel.findByIdAndUpdate(deliveryPerson._id, {
        isBusy: true,
        currentOrder: nearestOrder._id
      });

      // Create delivery record
      const delivery = new DeliveryModel({
        deliveryPerson: deliveryPerson._id,
        order: nearestOrder._id,
        pickupAddress: store?.address || 'Store address',
        deliveryAddress: nearestOrder.shippingAddress,
        estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000),
        deliveryFee: nearestOrder.deliveryFee || 0,
        status: 'Pending'
        });
      await delivery.save();

      // Send notification
      try {
        await notifyDeliveryAssigned(
          nearestOrder._id,
          nearestOrder.orderNumber || nearestOrder._id.toString().slice(-8),
          nearestOrder.user as any,
          deliveryPerson._id,
          deliveryPerson.name || 'Delivery Partner',
          store?._id
        );
      } catch (notifError) {
        console.error(`❌ [Assignment Service] Failed to send notification:`, notifError);
      }

      console.log(`✅ [Assignment Service] Assigned order ${nearestOrder._id} to newly online partner ${deliveryPerson.name} (${minDistance.toFixed(2)}km away)`);
      return 1;
    }

    console.log(`ℹ️ [Assignment Service] No nearby orders found for newly online partner ${deliveryPersonId}`);
    return 0;
  } catch (error) {
    console.error(`❌ [Assignment Service] Error in assignOrdersToNewlyOnlinePartner:`, error);
    return 0;
  }
}

