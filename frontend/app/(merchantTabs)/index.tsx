import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';

export default function MerchantHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    storeRating: 0,
    isStoreActive: false
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeStatusOpen, setStoreStatusOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMerchantStats = useCallback(async () => {
    try {
      setIsLoading(true);
      // Products count from merchant products endpoint (first page)
      const productsResp = await apiClient.get('/api/v1/product/merchant', { params: { page: 1, limit: 1 } });
      if (productsResp.data?.success) {
        setStats(prev => ({ ...prev, totalProducts: productsResp.data.pagination?.totalProducts || 0 }));
      }

      // Recent orders for the merchant (fetch few for dashboard)
      const ordersResp = await apiClient.get('/api/v1/merchant-order', { params: { page: 1, limit: 5 } });
      if (ordersResp.data?.success) {
        setRecentOrders(ordersResp.data.orders || []);
        setStats(prev => ({ ...prev, totalOrders: ordersResp.data.pagination?.totalOrders || 0 }));
      }

      // Pending orders count for merchant acceptance
      const pendingResp = await apiClient.get('/api/v1/merchant-order', { params: { status: 'Pending', page: 1, limit: 1 } });
      if (pendingResp.data?.success) {
        setStats(prev => ({ ...prev, pendingOrders: pendingResp.data.pagination?.totalOrders || 0 }));
      }

      // Removed settlements snapshot

      // Store rating from store details
      const storeResp = await apiClient.get('/api/v1/store/details');
      if (storeResp.data?.success) {
        const ratingAvg = storeResp.data.store?.rating?.average || 0;
        const isStoreActive = !!storeResp.data.store?.isActive;
        setStats(prev => ({ ...prev, storeRating: ratingAvg, isStoreActive }));
      }
    } catch (error) {
      console.error('Error loading merchant stats:', error);
      // don't spam alerts on dashboard
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMerchantStats();
  }, [loadMerchantStats]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadMerchantStats();
    } finally {
      setRefreshing(false);
    }
  }, [loadMerchantStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.header}
        >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name || 'Store Owner'}</Text>
          </View>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications" size={24} color={Colors.textPrimary} />
          </View>
        </View>
      </LinearGradient>

      {/* Stats - Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsScrollContent}
      >
        <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => router.push('/products' as any)}>
          <View style={styles.statIcon}>
            <Ionicons name="shirt" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => router.push('/orders' as any)}>
          <View style={styles.statIcon}>
            <Ionicons name="receipt" size={24} color={Colors.success} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => router.push({ pathname: '/orders', params: { status: 'Pending' } } as any)}>
          <View style={styles.statIcon}>
            <Ionicons name="time" size={24} color={Colors.warning} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending Acceptance</Text>
        </TouchableOpacity>
        {/* Removed settlements earnings card */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="star" size={24} color={Colors.warning} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.storeRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Store Rating</Text>
        </View>
        <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => setStoreStatusOpen(true)}>
          <View style={styles.statIcon}>
            <Ionicons name={stats.isStoreActive ? 'checkmark-circle' : 'close-circle'} size={24} color={stats.isStoreActive ? Colors.success : Colors.error} />
          </View>
          <Text style={styles.statNumber}>{stats.isStoreActive ? 'Active' : 'Inactive'}</Text>
          <Text style={styles.statLabel}>Store Status</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/merchant/CreateProduct')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Add Product</Text>
            <Text style={styles.actionSubtitle}>Add new items to your store</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(merchantTabs)/products')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="list" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Manage Products</Text>
            <Text style={styles.actionSubtitle}>View and edit your products</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => Alert.alert('Coming Soon', 'Analytics feature will be available soon!')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="analytics" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Analytics</Text>
            <Text style={styles.actionSubtitle}>View sales and performance</Text>
          </TouchableOpacity> */}
          


          {/* Removed settlements quick action */}

          {/* <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(merchantTabs)/profile?openStore=true' as any)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="storefront" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Store Settings</Text>
            <Text style={styles.actionSubtitle}>Manage store information</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Recent Orders from API */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <View style={styles.ordersList}>
          {recentOrders.length === 0 ? (
            <Text style={{ color: Colors.textSecondary }}>No recent orders</Text>
          ) : (
            recentOrders.map((o) => (
              <View key={o._id} style={styles.orderItem}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{o.orderNumber || String(o._id).slice(-8)}</Text>
                  <View style={[
                    styles.statusBadge,
                    o.status === 'Pending' ? styles.statusBadgePending :
                    o.status === 'Accepted' ? styles.statusBadgeAccepted :
                    o.status === 'Processing' ? styles.statusBadgeProcessing :
                    o.status === 'ReadyForPickup' ? styles.statusBadgeReady :
                    o.status === 'Delivered' ? styles.statusBadgeCompleted :
                    (o.status === 'Rejected' || o.status === 'Cancelled') ? styles.statusBadgeCancelled : null
                  ]}>
                    <Text style={styles.statusText}>{o.status}</Text>
                  </View>
                </View>
                <Text style={styles.customerName}>{o.user?.name || 'Customer'}</Text>
                <Text style={styles.orderAmount}>₹{Math.round(o.totalAmount)} • {o.orderItems?.length || 0} items</Text>
                {/* Payment chip */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <View style={[styles.paymentBadge, o.paymentStatus === 'Completed' ? styles.paymentCompleted : (o.paymentStatus === 'Pending' ? styles.paymentPending : styles.paymentFailed)]}>
                    <Ionicons name={o.paymentMethod === 'Online' ? 'card' : 'cash'} size={12} color={Colors.textPrimary} />
                    <Text style={styles.paymentText}>{o.paymentMethod} • {o.paymentStatus}</Text>
                  </View>
                </View>
                <Text style={styles.orderTime}>{new Date(o.createdAt).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </View>
      </ScrollView>

      {/* Store status action sheet */}
      {storeStatusOpen && (
        <View style={styles.storeStatusOverlay}>
          <TouchableOpacity style={styles.storeStatusBackdrop} activeOpacity={1} onPress={() => setStoreStatusOpen(false)} />
          <View style={styles.storeStatusSheet}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 }}>Set Store Status</Text>
            <View style={styles.storeStatusList}>
              <TouchableOpacity
                style={styles.storeStatusItem}
                onPress={async () => {
                  try {
                    await apiClient.put('/api/v1/store/update', { isActive: true });
                    setStats((prev) => ({ ...prev, isStoreActive: true }));
                  } catch {}
                  setStoreStatusOpen(false);
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.storeStatusText}>Open</Text>
              </TouchableOpacity>
              <View style={styles.storeStatusDivider} />
              <TouchableOpacity
                style={styles.storeStatusItem}
                onPress={async () => {
                  try {
                    await apiClient.put('/api/v1/store/update', { isActive: false });
                    setStats((prev) => ({ ...prev, isStoreActive: false }));
                  } catch {}
                  setStoreStatusOpen(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color={Colors.error} />
                <Text style={styles.storeStatusText}>Closed</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.storeStatusCancel} onPress={() => setStoreStatusOpen(false)}>
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 4,
  },
  notificationIcon: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
  },
  statsScroll: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  statsScrollContent: {
    gap: 12,
    paddingRight: 20,
  },
  statCard: {
    width: 140,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  ordersList: {
    gap: 12,
  },
  orderItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgePending: { backgroundColor: Colors.warning },
  statusBadgeAccepted: { backgroundColor: Colors.success },
  statusBadgeProcessing: {
    backgroundColor: Colors.primary,
  },
  statusBadgeReady: { backgroundColor: '#9C27B0' },
  statusBadgeCompleted: {
    backgroundColor: Colors.success,
  },
  statusBadgeCancelled: { backgroundColor: Colors.error },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  storeStatusSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: 8,
  },
  paymentCompleted: { backgroundColor: '#E8F5E9' },
  paymentPending: { backgroundColor: '#FFF8E1' },
  paymentFailed: { backgroundColor: '#FFEBEE' },
  paymentText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  storeStatusOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  storeStatusBackdrop: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  storeStatusList: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storeStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  storeStatusText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  storeStatusDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  storeStatusCancel: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
});
