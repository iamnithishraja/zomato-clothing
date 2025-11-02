import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';
import { useLocalSearchParams, useRouter } from 'expo-router';

const formatINR = (value: number) => Math.round(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const OrderDetailsScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { deliveryId } = params;
  
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const progressAnim = new Animated.Value(0);

  const loadDeliveryDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/v1/delivery/${deliveryId}`);
      if (response.data.success) {
        setDelivery(response.data.delivery);
        animateProgress(response.data.delivery.status);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load delivery details');
      router.back();
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryId]);

  useEffect(() => {
    loadDeliveryDetails();
  }, [loadDeliveryDetails]);

  const animateProgress = (status: string) => {
    const progressMap: { [key: string]: number } = {
      'Pending': 0.2,
      'Accepted': 0.4,
      'PickedUp': 0.6,
      'OnTheWay': 0.8,
      'Delivered': 1.0,
    };
    
    Animated.spring(progressAnim, {
      toValue: progressMap[status] || 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setProcessing(true);
      await apiClient.put(`/api/v1/delivery/${deliveryId}/status`, { status: newStatus });
      Alert.alert('Success', `Status updated to ${newStatus}`);
      await loadDeliveryDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleCollectCOD = async () => {
    try {
      const order = delivery?.order;
      const orderId = order && (typeof order === 'object' ? order._id : order);
      if (!orderId) return;

      setProcessing(true);
      await apiClient.post(`/api/v1/cod/${orderId}/collect`);
      Alert.alert('Success', 'COD collected successfully!');
      await loadDeliveryDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to collect COD');
    } finally {
      setProcessing(false);
    }
  };

  const openNavigation = (locationType: 'pickup' | 'delivery') => {
    console.log('🗺️ Opening navigation for:', locationType);
    console.log('📦 Delivery order data:', JSON.stringify(delivery?.order, null, 2));
    
    const order = delivery?.order;
    if (!order) {
      Alert.alert('Error', 'Order data not available');
      return;
    }

    // Get pickup location (from order or construct from store)
    let pickupLoc = order.pickupLocation;
    if (!pickupLoc || !pickupLoc.lat || !pickupLoc.lng) {
      // Try to use store address as fallback
      const store = order.store;
      if (store && store.address) {
        pickupLoc = {
          lat: 0, // Will need geocoding
          lng: 0,
          address: store.address
        };
        console.warn('⚠️ Pickup location coordinates missing, using store address');
      }
    }

    // Get delivery location (from order or construct from customer address)
    let deliveryLoc = order.deliveryLocation;
    if (!deliveryLoc || !deliveryLoc.lat || !deliveryLoc.lng) {
      // Try to use customer address as fallback
      if (order.address) {
        deliveryLoc = {
          lat: 0,
          lng: 0,
          address: order.address
        };
        console.warn('⚠️ Delivery location coordinates missing, using order address');
      }
    }

    // Validate the location we're trying to navigate to
    const targetLocation = locationType === 'pickup' ? pickupLoc : deliveryLoc;
    if (!targetLocation || !targetLocation.lat || !targetLocation.lng || targetLocation.lat === 0) {
      Alert.alert(
        'Location Not Available',
        `The ${locationType} location coordinates are not available. Please ensure the order has proper location data.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'View Address',
            onPress: () => {
              const address = locationType === 'pickup' 
                ? (order.store?.address || 'Not available')
                : (order.address || 'Not available');
              Alert.alert('Address', address);
            }
          }
        ]
      );
      return;
    }

    router.push({
      pathname: '/(deliveryTabs)/navigation-map',
      params: {
        pickupLocation: JSON.stringify(pickupLoc),
        deliveryLocation: JSON.stringify(deliveryLoc),
        orderId: order._id,
        navigationType: locationType,
      }
    } as any);
  };

  const callCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!delivery) return null;

  const order = typeof delivery.order === 'object' ? delivery.order : null;
  const store = order?.store;
  const customer = order?.user;

  const getNextAction = () => {
    if (processing) {
      return (
        <View style={styles.processingContainer}>
          <ActivityIndicator color="#667eea" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      );
    }

    switch (delivery.status) {
      case 'Pending':
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleStatusUpdate('Accepted')}
          >
            <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.buttonGradient}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Accept Delivery</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      
      case 'Accepted':
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleStatusUpdate('PickedUp')}
          >
            <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.buttonGradient}>
              <Ionicons name="cube" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Mark as Picked Up</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      
      case 'PickedUp':
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleStatusUpdate('OnTheWay')}
          >
            <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.buttonGradient}>
              <Ionicons name="rocket" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Delivery</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      
      case 'OnTheWay':
        if (order?.paymentMethod === 'COD' && order?.paymentStatus !== 'Completed') {
          return (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCollectCOD}
            >
              <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.buttonGradient}>
                <Ionicons name="cash" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Collect ₹{formatINR(order.totalAmount)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleStatusUpdate('Delivered')}
          >
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.buttonGradient}>
              <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Mark as Delivered</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      
      case 'Delivered':
        return (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-done-circle" size={32} color="#4CAF50" />
            <Text style={styles.completedText}>Delivery Completed!</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{delivery.status}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Number */}
        <View style={styles.orderNumberCard}>
          <Text style={styles.orderNumberLabel}>Order Number</Text>
          <Text style={styles.orderNumber}>#{order?.orderNumber || delivery._id.slice(-8)}</Text>
        </View>

        {/* Customer Info */}
        {customer && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer Information</Text>
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatar}>
                <Ionicons name="person" size={24} color="#667eea" />
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerPhone}>{customer.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => callCustomer(customer.phone)}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pickup Location */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pickup Location</Text>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => openNavigation('pickup')}
            >
              <Ionicons name="navigate" size={16} color="#667eea" />
              <Text style={styles.navigateText}>Navigate</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Ionicons name="storefront" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.locationAddress}>{delivery.pickupAddress}</Text>
          </View>
          {store && (
            <Text style={styles.storeNameText}>{store.storeName}</Text>
          )}
        </View>

        {/* Delivery Location */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Delivery Location</Text>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => openNavigation('delivery')}
            >
              <Ionicons name="navigate" size={16} color="#667eea" />
              <Text style={styles.navigateText}>Navigate</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={20} color="#F44336" />
            </View>
            <Text style={styles.locationAddress}>{delivery.deliveryAddress}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Method</Text>
            <View style={[styles.paymentBadge, { backgroundColor: order?.paymentMethod === 'COD' ? '#FFF3E0' : '#E8F5E9' }]}>
              <Text style={[styles.paymentBadgeText, { color: order?.paymentMethod === 'COD' ? '#FF9800' : '#4CAF50' }]}>
                {order?.paymentMethod}
              </Text>
            </View>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Order Total</Text>
            <Text style={styles.paymentValue}>₹{formatINR(order?.totalAmount || 0)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Your Earning</Text>
            <Text style={[styles.paymentValue, { color: '#4CAF50', fontWeight: '800' }]}>
              ₹{formatINR(delivery.deliveryFee)}
            </Text>
          </View>
          
          {order?.paymentMethod === 'COD' && (
            <View style={[styles.codStatusCard, order?.paymentStatus === 'Completed' ? styles.codCollected : styles.codPending]}>
              <Ionicons 
                name={order?.paymentStatus === 'Completed' ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color={order?.paymentStatus === 'Completed' ? "#4CAF50" : "#FF9800"} 
              />
              <Text style={[styles.codStatusText, { color: order?.paymentStatus === 'Completed' ? "#4CAF50" : "#FF9800" }]}>
                {order?.paymentStatus === 'Completed' ? 'Cash Collected' : 'Cash Not Collected'}
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {getNextAction()}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressContainer: {
    gap: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderNumberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orderNumberLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#667eea',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  navigateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationAddress: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    paddingTop: 8,
  },
  storeNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  codStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  codPending: {
    backgroundColor: '#FFF3E0',
  },
  codCollected: {
    backgroundColor: '#E8F5E9',
  },
  codStatusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionContainer: {
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
});

export default OrderDetailsScreen;

