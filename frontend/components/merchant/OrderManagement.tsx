import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import apiClient from '@/api/client';

const formatINR = (value: number) => Math.round(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
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

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = selectedStatus ? `?status=${selectedStatus}` : '';
      const response = await apiClient.get(`/api/v1/merchant-order${params}`);
      
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      await apiClient.post(`/api/v1/merchant-order/${orderId}/accept`);
      Alert.alert('Success', 'Order accepted successfully');
      await loadOrders();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order? Please provide a reason.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingOrderId(orderId);
              await apiClient.post(`/api/v1/merchant-order/${orderId}/reject`, {
                rejectionReason: 'Item unavailable'
              });
              Alert.alert('Success', 'Order rejected');
              await loadOrders();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject order');
            } finally {
              setProcessingOrderId(null);
            }
          },
        },
      ]
    );
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      await apiClient.post(`/api/v1/merchant-order/${orderId}/ready`);
      Alert.alert('Success', 'Order marked as ready for pickup');
      await loadOrders();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark order as ready');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const statusFilters = [
    { key: null, label: 'All' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Accepted', label: 'Accepted' },
    { key: 'Processing', label: 'Processing' },
    { key: 'ReadyForPickup', label: 'Ready' },
  ];

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.primary as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Incoming Orders</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Status Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key || 'all'}
              style={[
                styles.filterButton,
                selectedStatus === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedStatus(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === filter.key && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus 
                ? `No orders with status "${selectedStatus}"`
                : "You don't have any orders yet"}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const isProcessing = processingOrderId === order._id;
              
              return (
                <View key={order._id} style={styles.orderCard}>
                  {/* Order Header */}
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderNumber}>
                        Order #{order.orderNumber || order._id.slice(-8)}
                      </Text>
                      <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.customerInfo}>
                    <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.customerText}>
                      {typeof order.user === 'object' ? order.user.name : 'Customer'}
                    </Text>
                  </View>

                  {/* Order Items */}
                  <View style={styles.itemsSection}>
                    <Text style={styles.itemsTitle}>Items ({order.orderItems.length}):</Text>
                    {order.orderItems.map((item: any, index: number) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.product?.name || 'Product'} × {item.quantity}
                        </Text>
                        <Text style={styles.itemPrice}>₹{formatINR(item.price * item.quantity)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Order Total */}
                  <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>₹{formatINR(order.totalAmount)}</Text>
                  </View>

                  {/* Payment Info */}
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMethod}>
                      {order.paymentMethod} • {order.paymentStatus}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  {order.status === 'Pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectOrder(order._id)}
                        disabled={isProcessing}
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptOrder(order._id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Accept</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {(order.status === 'Accepted' || order.status === 'Processing') && (
                    <TouchableOpacity
                      style={[styles.readyButton]}
                      onPress={() => handleMarkReady(order._id)}
                      disabled={isProcessing}
                    >
                      <LinearGradient
                        colors={Colors.gradients.primary as [string, string]}
                        style={styles.readyButtonGradient}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color={Colors.textPrimary} />
                        ) : (
                          <>
                            <Ionicons name="cube-outline" size={20} color={Colors.textPrimary} />
                            <Text style={styles.readyButtonText}>Mark Ready for Pickup</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
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
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filtersWrapper: {
    backgroundColor: Colors.background,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  ordersList: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  customerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paymentInfo: {
    marginBottom: 16,
  },
  paymentMethod: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  readyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  readyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  readyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default OrderManagement;

