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
  Modal,
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
  const [codModalVisible, setCodModalVisible] = useState(false);
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

  const deliverySteps = [
    { key: 'Pending', label: 'Pending', icon: 'time-outline' },
    { key: 'Accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
    { key: 'PickedUp', label: 'Picked Up', icon: 'cube-outline' },
    { key: 'OnTheWay', label: 'On The Way', icon: 'bicycle-outline' },
    { key: 'Delivered', label: 'Delivered', icon: 'checkmark-done-circle' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string): 'completed' | 'current' | 'pending' => {
    const stepOrder = ['Pending', 'Accepted', 'PickedUp', 'OnTheWay', 'Delivered'];
    const currentIndex = stepOrder.indexOf(currentStatus);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

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

  const handleRejectDelivery = () => {
    Alert.alert(
      'Reject Delivery',
      'Are you sure you want to reject this delivery? It will be reassigned to another delivery partner.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const response = await apiClient.post(`/api/v1/delivery/${deliveryId}/reject`, {
                reason: 'Unable to deliver at this time'
              });

              if (response.data.success) {
                Alert.alert('Success', 'Delivery rejected. Order will be reassigned.', [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]);
              }
            } catch (error: any) {
              console.error('Error rejecting delivery:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject delivery');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const showCODModal = () => {
    setCodModalVisible(true);
  };

  const handleConfirmCODCollection = async () => {
    try {
      const order = delivery?.order;
      const orderId = order && (typeof order === 'object' ? order._id : order);
      if (!orderId) return;

      setProcessing(true);
      await apiClient.post(`/api/v1/cod/${orderId}/collect`);
      setCodModalVisible(false);
      Alert.alert('Success', 'COD collected successfully!');
      await loadDeliveryDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to collect COD');
    } finally {
      setProcessing(false);
    }
  };

  const openNavigation = (locationType: 'pickup' | 'delivery') => {
    const order = delivery?.order;
    if (!order) {
      Alert.alert('Error', 'Order data not available');
      return;
    }

    // Get store info for pickup
    const store = order.store;
    
    // Prepare pickup location (store)
    const pickupLocation = {
      lat: order.pickupLocation?.lat,
      lng: order.pickupLocation?.lng,
      address: delivery.pickupAddress || store?.address || '',
      mapLink: (store as any)?.mapLink // Pass mapLink if available
    };

    // Prepare delivery location (user address)
    const deliveryLocation = {
      lat: order.deliveryLocation?.lat,
      lng: order.deliveryLocation?.lng,
      address: delivery.deliveryAddress || order.shippingAddress || ''
    };

    // Navigate to in-app navigation screen
    router.push({
      pathname: '/(deliveryTabs)/navigation-map',
      params: {
        orderId: delivery._id,
        pickupLocation: JSON.stringify(pickupLocation),
        deliveryLocation: JSON.stringify(deliveryLocation),
        navigationType: locationType
      }
    });
  };

  const callCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
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
          <ActivityIndicator color="#FFD700" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      );
    }

    switch (delivery.status) {
      case 'Pending':
        return (
          <View style={styles.pendingActions}>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }]}
              onPress={() => handleStatusUpdate('Accepted')}
            >
              <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.buttonGradient}>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }]}
              onPress={handleRejectDelivery}
            >
              <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.buttonGradient}>
                <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Reject</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
              onPress={showCODModal}
            >
              <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.buttonGradient}>
                <Ionicons name="cash" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Collect ₹{formatINR(order.totalAmount)} Cash</Text>
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
        colors={['#FFD700', '#FFC107']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Delivery Steps Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.stepsContainer}>
            {deliverySteps.map((step, index) => {
              const stepStatus = getStepStatus(step.key, delivery.status);
              const isLast = index === deliverySteps.length - 1;
              
              return (
                <View key={step.key} style={styles.stepWrapper}>
                  <View style={styles.stepItem}>
                    {/* Step Circle with Icon */}
                    <View style={[
                      styles.stepCircle,
                      stepStatus === 'completed' && styles.stepCircleCompleted,
                      stepStatus === 'current' && styles.stepCircleCurrent,
                    ]}>
                      <Ionicons 
                        name={step.icon as any} 
                        size={20} 
                        color={stepStatus === 'pending' ? '#999' : '#FFFFFF'} 
                      />
                    </View>
                    
                    {/* Step Label */}
                    <Text style={[
                      styles.stepLabel,
                      stepStatus === 'current' && styles.stepLabelCurrent,
                      stepStatus === 'completed' && styles.stepLabelCompleted,
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                  
                  {/* Connection Line */}
                  {!isLast && (
                    <View style={[
                      styles.stepLine,
                      stepStatus === 'completed' && styles.stepLineCompleted,
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
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
                <Ionicons name="person" size={24} color="#FFD700" />
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerPhone}>{customer.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => callCustomer(customer.phone)}
              >
                <Ionicons name="call" size={20} color="#2D2D2D" />
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
              <Ionicons name="navigate" size={16} color="#FFD700" />
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
              <Ionicons name="navigate" size={16} color="#FFD700" />
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

      {/* COD Collection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={codModalVisible}
        onRequestClose={() => setCodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              style={styles.modalHeader}
            >
              <View style={styles.cashIconContainer}>
                <Ionicons name="cash" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>Collect Cash Payment</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Amount to Collect</Text>
              <View style={styles.amountDisplay}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.amountText}>
                  {formatINR(delivery?.order?.totalAmount || 0)}
                </Text>
              </View>

              <View style={styles.modalInfoCard}>
                <Ionicons name="information-circle" size={20} color="#FF9800" />
                <Text style={styles.modalInfoText}>
                  Please confirm you have collected the full payment from the customer
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setCodModalVisible(false)}
                  disabled={processing}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleConfirmCODCollection}
                  disabled={processing}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#2E7D32']}
                    style={styles.modalConfirmGradient}
                  >
                    {processing ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                        <Text style={styles.modalConfirmText}>Confirm</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#2D2D2D',
  },
  progressContainer: {
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  stepWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stepCircleCurrent: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
    maxWidth: 60,
  },
  stepLabelCompleted: {
    color: '#4CAF50',
  },
  stepLabelCurrent: {
    color: '#2196F3',
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  stepLineCompleted: {
    backgroundColor: '#4CAF50',
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
    fontSize: 22,
    fontWeight: '800',
    color: '#000000FF',
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
    color: '#2D2D2D',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FFD700',
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
  pendingActions: {
    flexDirection: 'row',
    gap: 12,
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
  // COD Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    padding: 32,
    alignItems: 'center',
  },
  cashIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalBody: {
    padding: 24,
  },
  modalLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF9800',
    marginRight: 8,
  },
  amountText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF9800',
    letterSpacing: -1,
  },
  modalInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default OrderDetailsScreen;

