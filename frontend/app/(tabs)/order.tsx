import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';
import { Order, OrdersResponse } from '@/types/order';
import OrderDetails from '@/components/user/OrderDetails';

export default function OrderScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = selectedStatus ? `?status=${selectedStatus}` : '';
      const response = await apiClient.get<OrdersResponse>(`/api/v1/order${params}`);
      
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setIsLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return Colors.warning;
      case 'Processing': return Colors.info;
      case 'Shipped': return Colors.primary;
      case 'Delivered': return Colors.success;
      case 'Cancelled': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return 'time-outline';
      case 'Processing': return 'cog-outline';
      case 'Shipped': return 'car-outline';
      case 'Delivered': return 'checkmark-circle-outline';
      case 'Cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const statusFilters = [
    { key: null, label: 'All' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Processing', label: 'Processing' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Delivered', label: 'Delivered' },
    { key: 'Cancelled', label: 'Cancelled' }
  ];

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus 
                ? `No orders with status "${selectedStatus}"`
                : "You haven't placed any orders yet"
              }
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => (
              <TouchableOpacity 
                key={order._id} 
                style={styles.orderCard}
                onPress={() => {
                  setSelectedOrderId(order._id);
                  setOrderDetailsVisible(true);
                }}
              >
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>Order #{order._id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Ionicons 
                      name={getStatusIcon(order.status) as any} 
                      size={14} 
                      color={Colors.textPrimary} 
                    />
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>

                {/* Order Details */}
                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="storefront-outline" size={16} color={Colors.textSecondary} />
                    </View>
                    <Text style={styles.detailText} numberOfLines={1}>
                      {order.store.storeName}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                    </View>
                    <Text style={styles.detailText} numberOfLines={2}>
                      {order.shippingAddress}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="cube-outline" size={16} color={Colors.textSecondary} />
                    </View>
                    <Text style={styles.detailText}>
                      {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                {/* Order Footer */}
                <View style={styles.orderFooter}>
                  <View style={styles.amountContainer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>₹{Math.round(order.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => {
                      setSelectedOrderId(order._id);
                      setOrderDetailsVisible(true);
                    }}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                    <Ionicons name="chevron-forward-outline" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Order Details Modal */}
      <Modal
        visible={orderDetailsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setOrderDetailsVisible(false);
          setSelectedOrderId(null);
          loadOrders(); // Refresh orders when modal closes
        }}
      >
        <View style={styles.modalContainer}>
          {selectedOrderId && (
            <OrderDetails 
              orderId={selectedOrderId} 
              onClose={() => {
                setOrderDetailsVisible(false);
                setSelectedOrderId(null);
                loadOrders(); // Refresh orders when closing
              }} 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

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
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
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
    alignItems: 'center',
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
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
    marginRight: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailIcon: {
    width: 24,
    alignItems: 'center',
    marginTop: 1,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
  },
  amountContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});