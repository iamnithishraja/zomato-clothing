import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { useRouter } from 'expo-router';

export default function DeliveryHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    averageRating: 0,
    totalEarnings: 0,
    isOnline: false
  } as any);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);

  const loadDeliveryStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/v1/delivery/stats/overview');
      if (response.data.success) {
        setStats(response.data.stats);
      }
      const recentsResp = await apiClient.get('/api/v1/delivery', { params: { page: 1, limit: 5 } });
      if (recentsResp.data?.success) {
        setRecentDeliveries(recentsResp.data.deliveries || []);
      }
    } catch (error) {
      console.error('Error loading delivery stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveryStats();
  }, [loadDeliveryStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveryStats();
    setRefreshing(false);
  }, [loadDeliveryStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
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
            <Text style={styles.userName}>{user?.name || 'Delivery Partner'}</Text>
          </View>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications" size={24} color={Colors.textPrimary} />
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => router.push('/(deliveryTabs)/delivery' as any)}>
          <View style={styles.statIcon}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.deliveredDeliveries}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => router.push('/(deliveryTabs)/delivery' as any)}>
          <View style={styles.statIcon}>
            <Ionicons name="star" size={24} color={Colors.warning} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => router.push('/(deliveryTabs)/settlement' as any)}>
          <View style={styles.statIcon}>
            <Ionicons name="cash" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : `₹${stats.totalEarnings}`}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(deliveryTabs)/delivery' as any)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="bicycle" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Toggle Online</Text>
            <Text style={styles.actionSubtitle}>Start/stop accepting orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(deliveryTabs)/delivery' as any)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="list" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>View Orders</Text>
            <Text style={styles.actionSubtitle}>Check pending deliveries</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(deliveryTabs)/settlement' as any)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="wallet" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Settlements</Text>
            <Text style={styles.actionSubtitle}>COD & payouts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentDeliveries.length === 0 ? (
            <Text style={{ color: Colors.textSecondary }}>No recent deliveries</Text>
          ) : (
            recentDeliveries.map((d) => (
              <View key={d._id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Order #{d.order?.orderNumber || String(d.order?._id || '').slice(-8)}</Text>
                  <Text style={styles.activityTime}>{new Date(d.createdAt).toLocaleString()}</Text>
                </View>
                <Text style={styles.activityAmount}>+₹{d.deliveryFee}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginTop: -15,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
    gap: 12,
  },
  actionCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
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
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
});
