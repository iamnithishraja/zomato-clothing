import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  amount: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  distance: string;
  estimatedTime: string;
}

export default function DeliveryScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [orders] = useState<DeliveryOrder[]>([
    {
      id: '1',
      orderNumber: '#1234',
      customerName: 'John Doe',
      address: '123 Main St, City',
      amount: 250,
      status: 'pending',
      distance: '2.5 km',
      estimatedTime: '15 mins'
    },
    {
      id: '2',
      orderNumber: '#1235',
      customerName: 'Jane Smith',
      address: '456 Oak Ave, City',
      amount: 180,
      status: 'accepted',
      distance: '1.8 km',
      estimatedTime: '12 mins'
    }
  ]);

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      isOnline ? 'Go Offline' : 'Go Online',
      isOnline ? 'You are now offline' : 'You are now online and ready to accept orders'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'accepted': return Colors.primary;
      case 'picked_up': return Colors.info;
      case 'delivered': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'picked_up': return 'Picked Up';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Available Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Orders</Text>
          {orders.filter(order => order.status === 'pending').map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusBadgeText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{order.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{order.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>₹{order.amount}</Text>
                </View>
              </View>
              
              <View style={styles.orderFooter}>
                <View style={styles.distanceInfo}>
                  <Ionicons name="bicycle" size={16} color={Colors.primary} />
                  <Text style={styles.distanceText}>{order.distance} • {order.estimatedTime}</Text>
                </View>
                <TouchableOpacity style={styles.acceptButton}>
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Active Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          {orders.filter(order => order.status !== 'pending' && order.status !== 'delivered').map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusBadgeText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{order.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{order.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>₹{order.amount}</Text>
                </View>
              </View>
              
              <View style={styles.orderFooter}>
                <View style={styles.distanceInfo}>
                  <Ionicons name="bicycle" size={16} color={Colors.primary} />
                  <Text style={styles.distanceText}>{order.distance} • {order.estimatedTime}</Text>
                </View>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>
                    {order.status === 'accepted' ? 'Pick Up' : 'Deliver'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
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
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
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
