import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';
import { Delivery, DeliveriesResponse, UpdateDeliveryStatusRequest } from '@/types/delivery';

export default function DeliveryScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const loadDeliveries = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = selectedStatus ? `?status=${selectedStatus}` : '';
      const response = await apiClient.get<DeliveriesResponse>(`/api/v1/delivery${params}`);
      
      if (response.data.success) {
        setDeliveries(response.data.deliveries);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
      Alert.alert('Error', 'Failed to load deliveries');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  }, [loadDeliveries]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      isOnline ? 'Go Offline' : 'Go Online',
      isOnline ? 'You are now offline' : 'You are now online and ready to accept orders'
    );
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updateData: UpdateDeliveryStatusRequest = { status: newStatus as any };
      const response = await apiClient.put(`/api/v1/delivery/${deliveryId}/status`, updateData);
      
      if (response.data.success) {
        Alert.alert('Success', `Delivery status updated to ${newStatus}`);
        loadDeliveries(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      Alert.alert('Error', 'Failed to update delivery status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return Colors.warning;
      case 'Accepted': return Colors.primary;
      case 'PickedUp': return Colors.info;
      case 'Delivered': return Colors.success;
      case 'Cancelled': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending': return 'Pending';
      case 'Accepted': return 'Accepted';
      case 'PickedUp': return 'Picked Up';
      case 'Delivered': return 'Delivered';
      case 'Cancelled': return 'Cancelled';
      default: return status;
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusFilters = [
    { key: null, label: 'All' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Accepted', label: 'Accepted' },
    { key: 'PickedUp', label: 'Picked Up' },
    { key: 'Delivered', label: 'Delivered' },
    { key: 'Cancelled', label: 'Cancelled' }
  ];

  const getActionButton = (delivery: Delivery) => {
    switch (delivery.status) {
      case 'Pending':
        return (
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => updateDeliveryStatus(delivery._id, 'Accepted')}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        );
      case 'Accepted':
        return (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => updateDeliveryStatus(delivery._id, 'PickedUp')}
          >
            <Text style={styles.actionButtonText}>Pick Up</Text>
          </TouchableOpacity>
        );
      case 'PickedUp':
        return (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => updateDeliveryStatus(delivery._id, 'Delivered')}
          >
            <Text style={styles.actionButtonText}>Deliver</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  if (isLoading && deliveries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading deliveries...</Text>
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
          <Text style={styles.headerTitle}>Delivery Orders</Text>
          <TouchableOpacity 
            style={[styles.onlineToggle, isOnline && styles.onlineToggleActive]}
            onPress={toggleOnlineStatus}
          >
            <View style={[styles.statusDot, isOnline && styles.statusDotActive]} />
            <Text style={[styles.statusText, isOnline && styles.statusTextActive]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Status Filters */}
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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {deliveries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Deliveries Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus 
                ? `No deliveries with status "${selectedStatus}"`
                : "No deliveries assigned to you yet"
              }
            </Text>
          </View>
        ) : (
          deliveries.map((delivery) => (
            <View key={delivery._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>#{delivery.order._id.slice(-8)}</Text>
                  <Text style={styles.orderDate}>{formatDate(delivery.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                  <Text style={styles.statusBadgeText}>{getStatusText(delivery.status)}</Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{delivery.order.user.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {delivery.deliveryAddress}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="storefront" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{delivery.order.store.storeName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>₹{delivery.order.totalAmount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>
                    Est: {formatTime(delivery.estimatedDeliveryTime)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderFooter}>
                <View style={styles.distanceInfo}>
                  <Ionicons name="bicycle" size={16} color={Colors.primary} />
                  <Text style={styles.distanceText}>Fee: ₹{delivery.deliveryFee}</Text>
                </View>
                {getActionButton(delivery)}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  onlineToggleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusTextActive: {
    color: Colors.textPrimary,
  },
  filtersContainer: {
    maxHeight: 50,
    marginTop: 10,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  orderCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

