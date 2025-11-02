import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import apiClient from '@/api/client';

export default function MerchantOrderDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/v1/order/${orderId}`);
      if (res.data?.success) setOrder(res.data.order);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) load();
  }, [orderId, load]);

  const totals = useMemo(() => {
    if (!order) return { items: 0, qty: 0 };
    const items = order.orderItems?.length || 0;
    const qty = order.orderItems?.reduce((s: number, it: any) => s + it.quantity, 0) || 0;
    return { items, qty };
  }, [order]);

  const acceptOrder = async () => {
    try {
      setProcessing(true);
      await apiClient.post(`/api/v1/merchant-order/${orderId}/accept`);
      await load();
      Alert.alert('Accepted', 'Order accepted');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to accept');
    } finally {
      setProcessing(false);
    }
  };

  const rejectOrder = async () => {
    Alert.alert('Reject Order', 'Provide a reason?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            setProcessing(true);
            await apiClient.post(`/api/v1/merchant-order/${orderId}/reject`, { reason: 'Item unavailable' });
            await load();
            Alert.alert('Rejected', 'Order rejected');
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to reject');
          } finally {
            setProcessing(false);
          }
        }
      }
    ]);
  };

  const markReady = async () => {
    try {
      setProcessing(true);
      await apiClient.post(`/api/v1/merchant-order/${orderId}/ready`);
      await load();
      Alert.alert('Updated', 'Marked Ready for Pickup');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to mark ready');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': '#FF9800',
      'Accepted': '#2196F3',
      'Processing': '#9C27B0',
      'Ready': '#4CAF50',
      'Completed': '#4CAF50',
      'Rejected': '#F44336',
      'Cancelled': '#757575'
    };
    return colors[status] || '#757575';
  };

  if (loading || !order) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading order...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient colors={Colors.gradients.primary as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.orderNumber}>#{order.orderNumber || String(order._id).slice(-8)}</Text>
            <Text style={styles.orderMeta}>{totals.items} items • {totals.qty} units</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* Status Cards */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>₹{Math.round(order.totalAmount).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Payment Info Pills */}
        <View style={styles.pillsContainer}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>💳 {order.paymentMethod}</Text>
          </View>
          <View style={[styles.pill, order.paymentStatus === 'Paid' && styles.pillPaid]}>
            <Text style={styles.pillText}>{order.paymentStatus}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Items Section with Modern Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totals.items}</Text>
            </View>
          </View>
          
          <View style={styles.itemsContainer}>
            {order.orderItems?.map((it: any, idx: number) => {
              const image = it.product?.images?.[0];
              const available = typeof it.product?.availableQuantity === 'number' ? it.product.availableQuantity : undefined;
              const shortfall = typeof available === 'number' ? (available < it.quantity) : false;
              
              return (
                <View key={idx} style={[styles.itemCard, shortfall && styles.itemCardWarning]}>
                  <View style={styles.itemImageContainer}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                        <Text style={styles.placeholderText}>📦</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.itemDetails}>
                    <Text numberOfLines={2} style={styles.itemName}>{it.product?.name || 'Product'}</Text>
                    
                    <View style={styles.itemMetaRow}>
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyText}>Qty: {it.quantity}</Text>
                      </View>
                      <Text style={styles.itemPrice}>₹{Math.round(it.price * it.quantity).toLocaleString('en-IN')}</Text>
                    </View>
                    
                    {typeof available === 'number' && (
                      <View style={[styles.stockBadge, shortfall && styles.stockBadgeWarning]}>
                        <Text style={[styles.stockText, shortfall && styles.stockTextWarning]}>
                          {shortfall ? '⚠️' : '✓'} Stock: {available}{shortfall ? ' (Low!)' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Customer Section with Modern Layout */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
          </View>
          
          <View style={styles.customerCard}>
            <View style={styles.customerRow}>
              <Text style={styles.customerIcon}>👤</Text>
              <View style={styles.customerInfo}>
                <Text style={styles.customerLabel}>Name</Text>
                <Text style={styles.customerValue}>{order.user?.name || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.customerRow}>
              <Text style={styles.customerIcon}>📱</Text>
              <View style={styles.customerInfo}>
                <Text style={styles.customerLabel}>Phone</Text>
                <Text style={styles.customerValue}>{order.user?.phone || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.customerRow}>
              <Text style={styles.customerIcon}>📍</Text>
              <View style={styles.customerInfo}>
                <Text style={styles.customerLabel}>Delivery Address</Text>
                <Text style={styles.customerValue}>{order.shippingAddress || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status History Timeline */}
        {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Status Timeline</Text>
            </View>
            
            <View style={styles.timelineContainer}>
              {order.statusHistory.map((h: any, i: number) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  {i < order.statusHistory.length - 1 && <View style={styles.timelineLine} />}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>{h.status}</Text>
                    <Text style={styles.timelineTime}>{new Date(h.timestamp).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modern Action Buttons */}
      {(order.status === 'Pending' || order.status === 'Accepted' || order.status === 'Processing') && (
        <View style={styles.actionContainer}>
          {order.status === 'Pending' ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]} 
                disabled={processing} 
                onPress={rejectOrder}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>✕ Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.acceptButton]} 
                disabled={processing} 
                onPress={acceptOrder}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={['#4CAF50', '#45a049']} 
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>✓ Accept Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.actionButtonFull} 
              disabled={processing} 
              onPress={markReady}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={Colors.gradients.primary as [string, string]} 
                style={styles.actionButtonGradient}
              >
                <Text style={[styles.actionButtonText, styles.actionButtonTextLarge]}>
                  ✓ Mark Ready for Pickup
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  loaderContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F8F9FA' 
  },
  loaderText: { 
    marginTop: 16, 
    color: '#757575', 
    fontSize: 16,
    fontWeight: '600'
  },
  header: { 
    paddingTop: 60, 
    paddingBottom: 24, 
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 20
  },
  headerLeft: { 
    flex: 1 
  },
  orderNumber: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  orderMeta: { 
    marginTop: 6, 
    color: '#FFFFFF', 
    opacity: 0.9,
    fontSize: 15,
    fontWeight: '600'
  },
  closeButton: { 
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.25)', 
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '800',
    fontSize: 20
  },
  statusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  statusBadge: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  statusText: { 
    color: '#FFFFFF', 
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  amountCard: { 
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 16,
    alignItems: 'flex-end'
  },
  amountLabel: { 
    color: '#FFFFFF', 
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
    marginBottom: 2
  },
  amountValue: { 
    color: '#FFFFFF', 
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5
  },
  pillsContainer: { 
    flexDirection: 'row', 
    gap: 10 
  },
  pill: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 14, 
    paddingVertical: 7, 
    borderRadius: 16 
  },
  pillPaid: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)'
  },
  pillText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 13
  },
  content: { 
    flex: 1 
  },
  section: { 
    paddingHorizontal: 20, 
    paddingTop: 24,
    paddingBottom: 8
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#1A1A1A',
    letterSpacing: 0.3
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: '#1976D2',
    fontWeight: '800',
    fontSize: 13
  },
  itemsContainer: { 
    gap: 12 
  },
  itemCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  itemCardWarning: { 
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800'
  },
  itemImageContainer: { 
    marginRight: 14
  },
  itemImage: { 
    width: 70, 
    height: 70, 
    borderRadius: 12
  },
  itemImagePlaceholder: { 
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderText: {
    fontSize: 32
  },
  itemDetails: { 
    flex: 1,
    justifyContent: 'center'
  },
  itemName: { 
    fontWeight: '800', 
    color: '#1A1A1A',
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 20
  },
  itemMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  qtyBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  qtyText: {
    color: '#424242',
    fontWeight: '700',
    fontSize: 13
  },
  itemPrice: {
    color: '#1A1A1A',
    fontWeight: '900',
    fontSize: 16
  },
  stockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  stockBadgeWarning: {
    backgroundColor: '#FFEBEE'
  },
  stockText: { 
    fontWeight: '700', 
    color: '#4CAF50',
    fontSize: 12
  },
  stockTextWarn: { 
    color: '#F44336'
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  customerIcon: {
    fontSize: 24,
    marginRight: 14,
    marginTop: 2
  },
  customerInfo: {
    flex: 1
  },
  customerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  customerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 22
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative'
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    marginRight: 14,
    marginTop: 6
  },
  timelineLine: {
    position: 'absolute',
    left: 5.5,
    top: 18,
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0'
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20
  },
  timelineStatus: {
    fontWeight: '800',
    color: '#1A1A1A',
    fontSize: 15,
    marginBottom: 4
  },
  timelineTime: {
    color: '#757575',
    fontSize: 13,
    fontWeight: '600'
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 18
  },
  acceptButton: {
    backgroundColor: 'transparent'
  },
  actionButtonFull: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  actionButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5
  },
  actionButtonTextLarge: {
    fontSize: 17
  }
});