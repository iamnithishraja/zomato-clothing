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

    // Find all delivery partners who are online (isActive)
    const allOnlinePartners = await UserModel.find({
      role: 'Delivery',
      isActive: true
    }).lean();

    console.log(`👥 [Assignment Service] Found ${allOnlinePartners.length} online delivery partner(s)`);

    // Filter to only those who are not busy
    const availableDeliveryPartners = await UserModel.find({
      role: 'Delivery',
      isActive: true,
      isBusy: false
    }).lean();

    if (availableDeliveryPartners.length === 0) {
      console.log(`⚠️ [Assignment Service] No delivery partners available (${allOnlinePartners.length} online but all busy)`);
      return;
    }

    console.log(`✅ [Assignment Service] Found ${availableDeliveryPartners.length} available delivery partner(s)`);

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

          // If no partner found within 5km, check if order is older than 60 seconds
          // Then expand search radius to 10km
          if (!selectedDeliveryPartner) {
            const orderAge = Date.now() - order.createdAt.getTime();
            const sixtySeconds = 60 * 1000;

            if (orderAge > sixtySeconds) {
              console.log(`⏰ [Assignment Service] Order ${order._id} is older than 60 seconds, expanding radius to 10km`);

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

          // If still no partner found, assign to the CLOSEST available partner regardless of distance
          if (!selectedDeliveryPartner) {
            console.log(`🌍 [Assignment Service] No partner within radius for order ${order._id}, finding closest partner regardless of distance...`);

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

                // Find minimum distance regardless of how far
                if (distance < minDistance) {
                  minDistance = distance;
                  selectedDeliveryPartner = partner;
                }
              }
            }

            if (selectedDeliveryPartner) {
              console.log(`📍 [Assignment Service] Closest partner found at ${minDistance.toFixed(2)}km away`);
            }
          }
        } else {
          // No location data, find closest available partner based on their location
          console.log(`📍 [Assignment Service] No pickup location for order ${order._id}, finding closest available partner...`);
          
          // Find partner with smallest location coordinates (closest to origin as tiebreaker)
          for (const partner of availableDeliveryPartners) {
            const partnerStatus = await UserModel.findById(partner._id).select('isBusy').lean();
            if (partnerStatus?.isBusy) continue;

            if (partner.currentLocation?.lat && partner.currentLocation?.lng) {
              // Calculate distance from origin (0,0) as a tiebreaker
              const distance = Math.sqrt(
                Math.pow(partner.currentLocation.lat, 2) + 
                Math.pow(partner.currentLocation.lng, 2)
              );
              
              if (distance < minDistance) {
                minDistance = distance;
                selectedDeliveryPartner = partner;
              }
            }
          }
          
          // If still no one selected, just take first available
          if (!selectedDeliveryPartner) {
            for (const partner of availableDeliveryPartners) {
              const partnerStatus = await UserModel.findById(partner._id).select('isBusy').lean();
              if (!partnerStatus?.isBusy) {
                selectedDeliveryPartner = partner;
                console.log(`✅ [Assignment Service] Assigned to first available partner (no location data)`);
                break;
              }
            }
          }
        }

        // If a delivery partner was found, assign the order
        if (selectedDeliveryPartner) {
          // Double-check order is still unassigned (prevent race condition)
          const orderCheck = await OrderModel.findOne({ 
            _id: order._id, 
            status: 'ReadyForPickup',
            deliveryPerson: { $exists: false }
          });
          
          if (!orderCheck) {
            console.log(`⚠️ [Assignment Service] Order ${order._id} was already assigned, skipping`);
            continue;
          }

          // Double-check delivery partner is still available (prevent race condition)
          const partnerCheck = await UserModel.findOne({
            _id: selectedDeliveryPartner._id,
            role: 'Delivery',
            isActive: true,
            isBusy: false
          });
          
          if (!partnerCheck) {
            console.log(`⚠️ [Assignment Service] Delivery partner ${selectedDeliveryPartner._id} is no longer available, skipping`);
            continue;
          }

          // Extra safety: Check if partner actually has any active deliveries
          const activeDeliveryCheck = await DeliveryModel.findOne({
            deliveryPerson: selectedDeliveryPartner._id,
            status: { $in: ['Accepted', 'PickedUp', 'OnTheWay'] }
          });

          if (activeDeliveryCheck) {
            console.log(`⚠️ [Assignment Service] Delivery partner ${selectedDeliveryPartner._id} has active delivery, clearing stuck busy flag`);
            // They have an active delivery, make sure isBusy is true
            await UserModel.findByIdAndUpdate(selectedDeliveryPartner._id, { isBusy: true });
            continue;
          } else if (partnerCheck.isBusy) {
            // They're marked busy but have no active delivery - clear it
            console.log(`🧹 [Assignment Service] Delivery partner ${selectedDeliveryPartner._id} marked busy with no active delivery, clearing stuck flag`);
            await UserModel.findByIdAndUpdate(selectedDeliveryPartner._id, { 
              isBusy: false,
              $unset: { currentOrder: 1 }
            });
          }

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

    // If no order found within 5km, find the CLOSEST order regardless of distance
    if (!nearestOrder) {
      console.log(`🌍 [Assignment Service] No order within 5km, finding closest order regardless of distance...`);
      
      for (const order of unassignedOrders) {
        if (order.pickupLocation?.lat && order.pickupLocation?.lng) {
          const distance = calculateDistance(
            deliveryPerson.currentLocation.lat,
            deliveryPerson.currentLocation.lng,
            order.pickupLocation.lat,
            order.pickupLocation.lng
          );

          // Find minimum distance regardless of how far
          if (distance < minDistance) {
            minDistance = distance;
            nearestOrder = order;
          }
        }
      }

      if (nearestOrder) {
        console.log(`📍 [Assignment Service] Closest order found at ${minDistance.toFixed(2)}km away`);
      }
    }

    // If found, assign the order
    if (nearestOrder) {
      // Double-check order is still unassigned (prevent race condition)
      const orderCheck = await OrderModel.findOne({ 
        _id: nearestOrder._id, 
        status: 'ReadyForPickup',
        deliveryPerson: { $exists: false }
      });
      
      if (!orderCheck) {
        console.log(`⚠️ [Assignment Service] Order ${nearestOrder._id} was already assigned`);
        return 0;
      }

      // Double-check delivery partner is still available (prevent race condition)
      const partnerCheck = await UserModel.findOne({
        _id: deliveryPerson._id,
        role: 'Delivery',
        isActive: true,
        isBusy: false
      });
      
      if (!partnerCheck) {
        console.log(`⚠️ [Assignment Service] Delivery partner ${deliveryPerson._id} is no longer available`);
        return 0;
      }

      // Extra safety: Check if partner actually has any active deliveries
      const activeDeliveryCheck = await DeliveryModel.findOne({
        deliveryPerson: deliveryPerson._id,
        status: { $in: ['Accepted', 'PickedUp', 'OnTheWay'] }
      });

      if (activeDeliveryCheck) {
        console.log(`⚠️ [Assignment Service] Newly online partner ${deliveryPerson._id} already has active delivery`);
        return 0;
      }

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

