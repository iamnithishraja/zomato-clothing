import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import apiClient from '@/api/client';

interface OrderDetailsProps {
  orderId: string;
  onClose?: () => void;
}

const formatINR = (value: number) => Math.round(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return '#FFA500';
    case 'Accepted':
      return '#4CAF50';
    case 'Processing':
      return '#2196F3';
    case 'ReadyForPickup':
      return '#9C27B0';
    case 'Shipped':
      return '#00BCD4';
    case 'Delivered':
      return '#4CAF50';
    case 'Cancelled':
    case 'Rejected':
      return '#F44336';
    default:
      return Colors.textSecondary;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'time-outline';
    case 'Accepted':
      return 'checkmark-circle-outline';
    case 'Processing':
      return 'construct-outline';
    case 'ReadyForPickup':
      return 'cube-outline';
    case 'Shipped':
      return 'bicycle-outline';
    case 'Delivered':
      return 'checkmark-done-circle';
    case 'Cancelled':
    case 'Rejected':
      return 'close-circle-outline';
    default:
      return 'help-circle-outline';
  }
};

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Flipkart-style status steps (end-state delivered)
  const statusSteps = useMemo(() => (
    ['Pending', 'Accepted', 'Processing', 'ReadyForPickup', 'Shipped', 'Delivered']
  ), []);

  const currentStepIndex = useMemo(() => {
    if (!order?.status) return 0;
    const idx = statusSteps.indexOf(order.status);
    if (idx >= 0) return idx;
    // If Cancelled/Rejected, show progress up to current history length - 1
    if (['Cancelled', 'Rejected'].includes(order.status)) {
      const histLen = Array.isArray(order?.statusHistory) ? order.statusHistory.length - 1 : 0;
      return Math.max(0, Math.min(histLen, statusSteps.length - 1));
    }
    return 0;
  }, [order?.status, order?.statusHistory, statusSteps]);

  const fetchOrderDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/v1/order/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleCancelOrder = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await apiClient.put(`/api/v1/order/${orderId}/status`, {
                status: 'Cancelled',
                cancellationReason: 'Cancelled by user',
              });
              Alert.alert('Success', 'Order cancelled successfully');
              fetchOrderDetails();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const handleRateStore = async () => {
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setSubmittingRating(true);
      await apiClient.post('/api/v1/stores/rate', {
        orderId: order._id,
        rating,
        review: review.trim() || undefined
      });
      Alert.alert('Success', 'Thank you for rating the store!');
      setShowRatingModal(false);
      setRating(0);
      setReview('');
      // Refresh order details to update the UI
      fetchOrderDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Order not found</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const canCancel = ['Pending', 'Accepted', 'Processing'].includes(order.status);
  const canRate = order.status === 'Delivered' && !order.storeRated;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.orderNumber}>Order #{order.orderNumber || order._id.slice(-8)}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status */}
        <View style={[styles.statusCard, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(order.status) as any} 
            size={32} 
            color={getStatusColor(order.status)} 
          />
          <View style={styles.statusTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {order.status}
              </Text>
              {order.storeRated && order.status === 'Delivered' && (
                <View style={styles.ratedBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratedBadgeText}>Rated</Text>
                </View>
              )}
            </View>
            <Text style={styles.statusSubtext}>
              {order.status === 'Pending' && 'Waiting for merchant confirmation'}
              {order.status === 'Accepted' && 'Order accepted by merchant'}
              {order.status === 'Processing' && 'Your order is being prepared'}
              {order.status === 'ReadyForPickup' && 'Ready for delivery pickup'}
              {order.status === 'Shipped' && 'Out for delivery'}
              {order.status === 'Delivered' && `Delivered on ${formatDate(order.deliveryDate || order.updatedAt)}`}
              {order.status === 'Cancelled' && 'Order cancelled'}
              {order.status === 'Rejected' && 'Order rejected by merchant'}
            </Text>
          </View>
        </View>
      </View>

      {/* Store Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Details</Text>
        <View style={styles.storeCard}>
          <Ionicons name="storefront" size={24} color={Colors.primary} />
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>
              {typeof order.store === 'object' ? order.store.storeName : 'Store'}
            </Text>
            {typeof order.store === 'object' && order.store.address && (
              <Text style={styles.storeAddress}>{order.store.address}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.orderItems.map((item: any, index: number) => (
          <View key={index} style={styles.orderItem}>
            <Image
              source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/80' }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
              <Text style={styles.itemPrice}>₹{formatINR(item.price)} × {item.quantity}</Text>
              <Text style={styles.itemTotal}>Total: ₹{formatINR(item.price * item.quantity)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.addressCard}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <Text style={styles.addressText}>{order.shippingAddress}</Text>
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Items Total</Text>
            <Text style={styles.paymentValue}>₹{formatINR(order.itemsTotal)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Delivery Fee</Text>
            <Text style={styles.paymentValue}>₹{formatINR(order.deliveryFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabelBold}>Total Amount</Text>
            <Text style={styles.paymentValueBold}>₹{formatINR(order.totalAmount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={[styles.paymentValue, { color: order.paymentMethod === 'COD' ? Colors.success : Colors.primary }]}>
              {order.paymentMethod}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <Text style={[styles.paymentValue, { 
              color: order.paymentStatus === 'Completed' ? Colors.success : 
                     order.paymentStatus === 'Failed' ? Colors.error : Colors.warning 
            }]}>
              {order.paymentStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* Order Tracking (Flipkart-style stepper) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Tracking</Text>
        <View style={styles.stepperCard}>
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex && !['Cancelled', 'Rejected'].includes(order.status);
            const isCurrent = idx === currentStepIndex && !['Cancelled', 'Rejected'].includes(order.status);
            const isCancelled = ['Cancelled', 'Rejected'].includes(order.status);

            // Colors
            const dotColor = isCancelled ? Colors.error : (isCompleted ? Colors.success : Colors.primary);
            const lineColor = (idx < currentStepIndex && !isCancelled) ? Colors.success : Colors.primary;

            // Find timestamp/note from history if available
            const historyForStep = Array.isArray(order.statusHistory)
              ? order.statusHistory.find((h: any) => h.status === step)
              : null;
            const timestamp = historyForStep?.timestamp || order.updatedAt || order.createdAt;
            const note = historyForStep?.note;

            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View style={[styles.stepDot, { backgroundColor: dotColor }]} />
                  {idx < statusSteps.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: lineColor }]} />
                  )}
                </View>
                <View style={styles.stepContentCol}>
                  <View style={styles.stepHeaderRow}>
                    <Text style={[styles.stepTitle, (isCompleted || isCurrent) ? styles.stepTitleActive : undefined]}>
                      {step}
                    </Text>
                    {isCancelled && idx === currentStepIndex && (
                      <View style={styles.cancelBadge}>
                        <Ionicons name="close" size={12} color={Colors.textPrimary} />
                        <Text style={styles.cancelText}>Cancelled</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.stepSubtext}>{formatDate(timestamp)}</Text>
                  {!!note && <Text style={styles.stepNote}>{note}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {canCancel && (
          <TouchableOpacity
            style={[styles.actionButton, cancelling && styles.actionButtonDisabled]}
            onPress={handleCancelOrder}
            disabled={cancelling}
          >
            <LinearGradient
              colors={cancelling ? ['#CCCCCC', '#CCCCCC'] : ['#F44336', '#E53935']}
              style={styles.actionGradient}
            >
              {cancelling ? (
                <>
                  <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Cancelling...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Cancel Order</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {canRate && (
          <TouchableOpacity style={styles.actionButton} onPress={handleRateStore}>
            <LinearGradient
              colors={Colors.gradients.primary as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="star-outline" size={20} color={Colors.textPrimary} />
              <Text style={[styles.actionButtonText, { color: Colors.textPrimary }]}>Rate Store</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.ratingModalOverlay}>
          <View style={styles.ratingModalContainer}>
            <View style={styles.ratingModalHeader}>
              <Text style={styles.ratingModalTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingModalSubtitle}>
              {order?.store?.storeName ? `How was your experience with ${order.store.storeName}?` : 'How was your experience?'}
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? '#FFD700' : Colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Review Input */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitRatingButton, submittingRating && styles.submitRatingButtonDisabled]}
              onPress={submitRating}
              disabled={submittingRating || rating === 0}
            >
              <LinearGradient
                colors={rating === 0 ? ['#CCCCCC', '#CCCCCC'] : Colors.gradients.primary as [string, string]}
                style={styles.submitRatingGradient}
              >
                {submittingRating ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color={Colors.textPrimary} />
                    <Text style={styles.submitRatingText}>Submit Rating</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
    marginTop: 16,
  },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  closeIcon: {
    padding: 4,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  statusTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  storeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  storeAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  paymentCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paymentValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  // Flipkart-style stepper
  stepperCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIndicatorCol: {
    width: 24,
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  stepLine: {
    flex: 1,
    width: 2,
    marginTop: 2,
    marginBottom: -2,
  },
  stepContentCol: {
    flex: 1,
    marginLeft: 12,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepTitleActive: {
    color: Colors.textPrimary,
  },
  stepSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cancelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.error + '15',
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  ratingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ratingModalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  ratingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ratingModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  starButton: {
    padding: 4,
  },
  reviewInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
    marginBottom: 20,
  },
  submitRatingButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitRatingButtonDisabled: {
    opacity: 0.6,
  },
  submitRatingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
  },
});

export default OrderDetails;

