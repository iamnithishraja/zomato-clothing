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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
    case 'PickedUp':
      return '#2196F3';
    case 'Delivered':
      return '#4CAF50';
    case 'Cancelled':
      return '#F44336';
    default:
      return Colors.textSecondary;
  }
};

const DeliveryDashboard: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [processingDeliveryId, setProcessingDeliveryId] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [codModalVisible, setCodModalVisible] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load deliveries
      const params = selectedStatus ? `?status=${selectedStatus}` : '';
      const deliveriesResponse = await apiClient.get(`/api/v1/delivery${params}`);
      
      // Load stats
      const statsResponse = await apiClient.get('/api/v1/delivery/stats/overview');
      
      if (deliveriesResponse.data.success) {
        setDeliveries(deliveriesResponse.data.deliveries || []);
      }
      
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (deliveryId: string, newStatus: string) => {
    try {
      setProcessingDeliveryId(deliveryId);
      await apiClient.put(`/api/v1/delivery/${deliveryId}/status`, {
        status: newStatus
      });
      Alert.alert('Success', `Delivery status updated to ${newStatus}`);
      await loadData();
      setDetailsModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessingDeliveryId(null);
    }
  };

  const handleCollectCOD = async (deliveryId: string) => {
    try {
      setProcessingDeliveryId(deliveryId);
      const delivery = deliveries.find(d => d._id === deliveryId);
      const orderId = delivery && delivery.order && (typeof delivery.order === 'object' ? delivery.order._id : delivery.order);
      if (!orderId) {
        throw new Error('Order not found for this delivery');
      }
      await apiClient.post(`/api/v1/cod/${orderId}/collect`);
      Alert.alert('Success', 'COD amount collected successfully');
      await loadData();
      setCodModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to collect COD');
    } finally {
      setProcessingDeliveryId(null);
    }
  };

  const statusFilters = [
    { key: null, label: 'All' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Accepted', label: 'Accepted' },
    { key: 'PickedUp', label: 'Picked Up' },
    { key: 'Delivered', label: 'Delivered' },
  ];

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        <View>
          <Text style={styles.headerTitle}>Delivery Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your deliveries</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </LinearGradient>

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
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => setSelectedStatus('Delivered')}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.statGradient}
              >
                <Ionicons name="checkmark-circle-outline" size={32} color="#FFFFFF" />
                <Text style={styles.statNumber}>{stats.totalDeliveries || 0}</Text>
                <Text style={styles.statLabel}>Total Deliveries</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => setSelectedStatus('PickedUp')}>
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.statGradient}
              >
                <Ionicons name="bicycle-outline" size={32} color="#FFFFFF" />
                <Text style={styles.statNumber}>{stats.activeDeliveries || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => router.push('/delivery/settlement' as any)}>
              <LinearGradient
                colors={['#FFA500', '#FF8C00']}
                style={styles.statGradient}
              >
                <Ionicons name="cash-outline" size={32} color="#FFFFFF" />
                <Text style={styles.statNumber}>₹{formatINR(stats.totalEarnings || 0)}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
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

        {/* Deliveries List */}
        <View style={styles.deliveriesSection}>
          {deliveries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bicycle-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Deliveries</Text>
              <Text style={styles.emptySubtitle}>
                {selectedStatus 
                  ? `No deliveries with status "${selectedStatus}"`
                  : "You don't have any deliveries assigned yet"}
              </Text>
            </View>
          ) : (
            deliveries.map((delivery) => {
              const order = typeof delivery.order === 'object' ? delivery.order : null;
              const isProcessing = processingDeliveryId === delivery._id;
              
              return (
                <TouchableOpacity 
                  key={delivery._id} 
                  style={styles.deliveryCard}
                  onPress={() => {
                    setSelectedDelivery(delivery);
                    setDetailsModalVisible(true);
                  }}
                >
                  {/* Delivery Header */}
                  <View style={styles.deliveryHeader}>
                    <View>
                      <Text style={styles.deliveryId}>
                        Delivery #{delivery._id.slice(-8)}
                      </Text>
                      {order && (
                        <Text style={styles.orderId}>
                          Order #{order.orderNumber || order._id?.slice(-8)}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                      <Text style={styles.statusText}>{delivery.status}</Text>
                    </View>
                  </View>

                  {/* Delivery Info */}
                  <View style={styles.deliveryInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={16} color={Colors.primary} />
                      <Text style={styles.infoText} numberOfLines={2}>
                        {delivery.deliveryAddress}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Ionicons name="cash-outline" size={16} color={Colors.success} />
                      <Text style={styles.infoText}>
                        Delivery Fee: ₹{formatINR(delivery.deliveryFee)}
                      </Text>
                    </View>

                    {order && order.paymentMethod === 'COD' && (
                      <View style={styles.infoRow}>
                        <Ionicons name="wallet-outline" size={16} color={Colors.warning} />
                        <Text style={[styles.infoText, { color: Colors.warning, fontWeight: '600' }]}>
                          COD: ₹{formatINR(order.totalAmount)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Quick Actions */}
                  {delivery.status === 'Pending' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUpdateStatus(delivery._id, 'Accepted')}
                      disabled={isProcessing}
                    >
                      <LinearGradient
                        colors={Colors.gradients.primary as [string, string]}
                        style={styles.actionGradient}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color={Colors.textPrimary} />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={20} color={Colors.textPrimary} />
                            <Text style={styles.actionText}>Accept Delivery</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {delivery.status === 'Accepted' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUpdateStatus(delivery._id, 'PickedUp')}
                      disabled={isProcessing}
                    >
                      <LinearGradient
                        colors={['#2196F3', '#1976D2']}
                        style={styles.actionGradient}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="cube" size={20} color="#FFFFFF" />
                            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Mark Picked Up</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {delivery.status === 'PickedUp' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUpdateStatus(delivery._id, 'Delivered')}
                      disabled={isProcessing}
                    >
                      <LinearGradient
                        colors={['#4CAF50', '#45A049']}
                        style={styles.actionGradient}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Mark Delivered</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Delivery Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Delivery Details</Text>
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {selectedDelivery && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Delivery Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedDelivery.status) }]}>
                    <Text style={styles.statusText}>{selectedDelivery.status}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Fee</Text>
                  <Text style={styles.detailValue}>₹{formatINR(selectedDelivery.deliveryFee)}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Addresses</Text>
                <View style={styles.addressBox}>
                  <Text style={styles.addressLabel}>Pickup Address</Text>
                  <Text style={styles.addressText}>{selectedDelivery.pickupAddress}</Text>
                </View>
                <View style={styles.addressBox}>
                  <Text style={styles.addressLabel}>Delivery Address</Text>
                  <Text style={styles.addressText}>{selectedDelivery.deliveryAddress}</Text>
                </View>
              </View>

                  {selectedDelivery.order && selectedDelivery.order.paymentMethod === 'COD' && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Cash on Delivery</Text>
                  <View style={styles.codBox}>
                    <Text style={styles.codAmount}>₹{formatINR(selectedDelivery.order.totalAmount)}</Text>
                    <Text style={styles.codLabel}>Amount to Collect</Text>
                  </View>
                      {(selectedDelivery.status === 'PickedUp' || selectedDelivery.status === 'Delivered') && (
                    <TouchableOpacity
                      style={styles.codButton}
                      onPress={() => {
                        setCodModalVisible(true);
                        setDetailsModalVisible(false);
                      }}
                    >
                      <Text style={styles.codButtonText}>Mark COD Collected</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* COD Collection Modal */}
      <Modal
        visible={codModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCodModalVisible(false)}
      >
        <View style={styles.codModalOverlay}>
          <View style={styles.codModalContainer}>
            <Ionicons name="cash" size={64} color={Colors.success} />
            <Text style={styles.codModalTitle}>Collect COD Payment</Text>
            <Text style={styles.codModalSubtitle}>
              Have you collected the payment from the customer?
            </Text>
            {selectedDelivery && selectedDelivery.order && (
              <Text style={styles.codModalAmount}>
                ₹{formatINR(selectedDelivery.order.totalAmount)}
              </Text>
            )}
            <View style={styles.codModalButtons}>
              <TouchableOpacity
                style={[styles.codModalButton, styles.codModalButtonCancel]}
                onPress={() => {
                  setCodModalVisible(false);
                  setDetailsModalVisible(true);
                }}
              >
                <Text style={styles.codModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.codModalButton, styles.codModalButtonConfirm]}
                onPress={() => selectedDelivery && handleCollectCOD(selectedDelivery._id)}
              >
                <Text style={[styles.codModalButtonText, { color: '#FFFFFF' }]}>Confirm Collection</Text>
              </TouchableOpacity>
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
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  filtersWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filtersContent: {
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
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
  deliveriesSection: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  deliveryCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderId: {
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
  deliveryInfo: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addressBox: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  codBox: {
    backgroundColor: Colors.success + '20',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  codAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.success,
  },
  codLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  codButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  codButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  codModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codModalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
    maxWidth: 400,
  },
  codModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  codModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  codModalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 16,
  },
  codModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  codModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  codModalButtonCancel: {
    backgroundColor: Colors.backgroundSecondary,
  },
  codModalButtonConfirm: {
    backgroundColor: Colors.success,
  },
  codModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default DeliveryDashboard;

