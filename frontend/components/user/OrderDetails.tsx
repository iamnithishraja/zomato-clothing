import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
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

  const handleRateStore = async () => {
    // Navigate to rating screen or show rating modal
    Alert.alert('Rate Store', 'Rating feature coming soon!');
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
  const canRate = order.status === 'Delivered';

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
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status}
            </Text>
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

      {/* Order Timeline */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timelineCard}>
            {order.statusHistory.map((history: any, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < order.statusHistory.length - 1 && <View style={styles.timelineLine} />}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{history.status}</Text>
                  <Text style={styles.timelineDate}>{formatDate(history.timestamp)}</Text>
                  {history.note && (
                    <Text style={styles.timelineNote}>{history.note}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

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
  timelineCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: 12,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 5.5,
    top: 16,
    bottom: -20,
    width: 1,
    backgroundColor: Colors.border,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
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
});

export default OrderDetails;

