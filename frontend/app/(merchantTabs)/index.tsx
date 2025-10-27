import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
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
    totalEarnings: 0,
    storeRating: 0,
    isStoreActive: false
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadMerchantStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/v1/user/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading merchant stats:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMerchantStats();
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="shirt" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="receipt" size={24} color={Colors.success} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="star" size={24} color={Colors.warning} />
          </View>
          <Text style={styles.statNumber}>{isLoading ? '...' : stats.storeRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Store Rating</Text>
        </View>
      </View>

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
          


           <TouchableOpacity 
             style={styles.actionCard}
             onPress={() => router.push('/settlement' as any)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="wallet" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Settlements</Text>
            <Text style={styles.actionSubtitle}>View earnings and payouts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(merchantTabs)/profile?openStore=true' as any)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="storefront" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Store Settings</Text>
            <Text style={styles.actionSubtitle}>Manage store information</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <View style={styles.ordersList}>
          <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#1234</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending</Text>
              </View>
            </View>
            <Text style={styles.customerName}>John Doe</Text>
            <Text style={styles.orderAmount}>₹250 • 2 items</Text>
            <Text style={styles.orderTime}>2 minutes ago</Text>
          </View>
          
          <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#1233</Text>
              <View style={[styles.statusBadge, styles.statusBadgeProcessing]}>
                <Text style={styles.statusText}>Processing</Text>
              </View>
            </View>
            <Text style={styles.customerName}>Jane Smith</Text>
            <Text style={styles.orderAmount}>₹180 • 1 item</Text>
            <Text style={styles.orderTime}>15 minutes ago</Text>
          </View>
          
          <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#1232</Text>
              <View style={[styles.statusBadge, styles.statusBadgeCompleted]}>
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
            <Text style={styles.customerName}>Mike Johnson</Text>
            <Text style={styles.orderAmount}>₹320 • 3 items</Text>
            <Text style={styles.orderTime}>1 hour ago</Text>
          </View>
        </View>
      </View>
      </ScrollView>
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
  statusBadgeProcessing: {
    backgroundColor: Colors.primary,
  },
  statusBadgeCompleted: {
    backgroundColor: Colors.success,
  },
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
});
