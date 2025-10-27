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
  Animated,
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
      return '#FF9800';
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
      return 'sync-outline';
    case 'ReadyForPickup':
      return 'cube-outline';
    case 'Shipped':
      return 'car-outline';
    case 'Delivered':
      return 'checkmark-done-outline';
    case 'Cancelled':
    case 'Rejected':
      return 'close-circle-outline';
    default:
      return 'help-outline';
  }
};

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

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

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

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
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingOrderId(orderId);
              await apiClient.post(`/api/v1/merchant-order/${orderId}/reject`, {
                reason: 'Item unavailable'
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
    { key: null, label: 'All', icon: 'apps-outline' },
    { key: 'Pending', label: 'Pending', icon: 'time-outline' },
    { key: 'Accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
    { key: 'Processing', label: 'Processing', icon: 'sync-outline' },
    { key: 'ReadyForPickup', label: 'Ready', icon: 'cube-outline' },
  ];

  const getOrderStats = () => {
    const pending = orders.filter(o => o.status === 'Pending').length;
    const accepted = orders.filter(o => o.status === 'Accepted' || o.status === 'Processing').length;
    const ready = orders.filter(o => o.status === 'ReadyForPickup').length;
    
    return { pending, accepted, ready };
  };

  const stats = getOrderStats();

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
      {/* Enhanced Header with Stats */}
      <LinearGradient
        colors={Colors.gradients.primary as [string, string]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.headerSubtitle}>{orders.length} total orders</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
              <Ionicons name="time-outline" size={18} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
              <Ionicons name="sync-outline" size={18} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{stats.accepted}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(156, 39, 176, 0.15)' }]}>
              <Ionicons name="cube-outline" size={18} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>{stats.ready}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Status Filters */}
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
                styles.filterChip,
                selectedStatus === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedStatus(filter.key)}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={selectedStatus === filter.key ? Colors.textPrimary : Colors.textSecondary}
              />
              <Text style={[
                styles.filterChipText,
                selectedStatus === filter.key && styles.filterChipTextActive
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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={56} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus 
                ? `No orders with status "${selectedStatus}"`
                : "New orders will appear here"}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const isProcessing = processingOrderId === order._id;
              const isExpanded = expandedOrders.has(order._id);
              
              return (
                <TouchableOpacity 
                  key={order._id} 
                  style={styles.orderCard}
                  onPress={() => toggleOrderExpansion(order._id)}
                  activeOpacity={0.7}
                >
                  {/* Order Header */}
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <View style={[styles.orderIconContainer, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                        <Ionicons 
                          name={getStatusIcon(order.status) as any} 
                          size={20} 
                          color={getStatusColor(order.status)} 
                        />
                      </View>
                      <View style={styles.orderHeaderInfo}>
                        <Text style={styles.orderNumber}>
                          #{order.orderNumber || order._id.slice(-8)}
                        </Text>
                        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                  </View>

                  {/* Customer & Amount Row */}
                  <View style={styles.summaryRow}>
                    <View style={styles.customerBadge}>
                      <Ionicons name="person" size={14} color={Colors.textSecondary} />
                      <Text style={styles.customerName}>
                        {typeof order.user === 'object' ? order.user.name : 'Customer'}
                      </Text>
                    </View>
                    <Text style={styles.orderAmount}>₹{formatINR(order.totalAmount)}</Text>
                  </View>

                  {/* Items Preview */}
                  <View style={styles.itemsPreview}>
                    <Ionicons name="basket-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.itemsPreviewText}>
                      {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}
                    </Text>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={Colors.textSecondary}
                      style={styles.expandIcon}
                    />
                  </View>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.divider} />
                      
                      {/* Order Items */}
                      <View style={styles.itemsSection}>
                        <Text style={styles.sectionTitle}>Order Items</Text>
                        {order.orderItems.map((item: any, index: number) => (
                          <View key={index} style={styles.itemRow}>
                            <View style={styles.itemQuantityBadge}>
                              <Text style={styles.itemQuantity}>{item.quantity}×</Text>
                            </View>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {item.product?.name || 'Product'}
                            </Text>
                            <Text style={styles.itemPrice}>₹{formatINR(item.price * item.quantity)}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Payment Info */}
                      <View style={styles.paymentSection}>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Payment Method</Text>
                          <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Payment Status</Text>
                          <View style={[
                            styles.paymentStatusBadge,
                            { backgroundColor: order.paymentStatus === 'Paid' ? '#E8F5E9' : '#FFF3E0' }
                          ]}>
                            <Text style={[
                              styles.paymentStatusText,
                              { color: order.paymentStatus === 'Paid' ? '#4CAF50' : '#FF9800' }
                            ]}>
                              {order.paymentStatus}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      {/* Action Buttons */}
                      {order.status === 'Pending' && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleRejectOrder(order._id)}
                            disabled={isProcessing}
                          >
                            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Reject</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAcceptOrder(order._id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Accept</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}

                      {(order.status === 'Accepted' || order.status === 'Processing') && (
                        <TouchableOpacity
                          style={styles.readyButton}
                          onPress={() => handleMarkReady(order._id)}
                          disabled={isProcessing}
                        >
                          <LinearGradient
                            colors={Colors.gradients.primary as [string, string]}
                            style={styles.readyButtonGradient}
                          >
                            {isProcessing ? (
                              <ActivityIndicator color={Colors.textPrimary} size="small" />
                            ) : (
                              <>
                                <Ionicons name="cube" size={20} color={Colors.textPrimary} />
                                <Text style={styles.readyButtonText}>Mark Ready for Pickup</Text>
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    opacity: 0.7,
    marginTop: 4,
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    opacity: 0.8,
    fontWeight: '600',
  },
  filtersWrapper: {
    backgroundColor: 'transparent',
    paddingVertical: 20,
    marginTop: -16,
  },
  filtersContainer: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 10,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  ordersList: {
    padding: 20,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderHeaderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  itemsPreviewText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  expandedContent: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  itemQuantityBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemName: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paymentSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
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
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  readyButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  readyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  readyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default OrderManagement;