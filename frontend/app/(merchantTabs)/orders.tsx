import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderTime: string;
  deliveryAddress: string;
}

export default function MerchantOrders() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'ready'>('all');
  
  const [orders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: '#1234',
      customerName: 'John Doe',
      customerPhone: '+91 9876543210',
      items: [
        { name: 'T-Shirt', quantity: 2, price: 250 },
        { name: 'Jeans', quantity: 1, price: 800 }
      ],
      totalAmount: 1300,
      status: 'pending',
      orderTime: '2 minutes ago',
      deliveryAddress: '123 Main St, City'
    },
    {
      id: '2',
      orderNumber: '#1233',
      customerName: 'Jane Smith',
      customerPhone: '+91 9876543211',
      items: [
        { name: 'Dress', quantity: 1, price: 1200 }
      ],
      totalAmount: 1200,
      status: 'confirmed',
      orderTime: '15 minutes ago',
      deliveryAddress: '456 Oak Ave, City'
    },
    {
      id: '3',
      orderNumber: '#1232',
      customerName: 'Mike Johnson',
      customerPhone: '+91 9876543212',
      items: [
        { name: 'Shirt', quantity: 1, price: 400 },
        { name: 'Trousers', quantity: 1, price: 600 }
      ],
      totalAmount: 1000,
      status: 'preparing',
      orderTime: '30 minutes ago',
      deliveryAddress: '789 Pine St, City'
    }
  ]);

  const filters = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'confirmed': return Colors.primary;
      case 'preparing': return Colors.info;
      case 'ready': return Colors.success;
      case 'delivered': return Colors.success;
      case 'cancelled': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'delivered';
      default: return currentStatus;
    }
  };

  const handleStatusUpdate = (orderId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    Alert.alert(
      'Update Status',
      `Change order status to ${getStatusText(nextStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: () => {
          // Here you would typically make an API call to update the order status
          Alert.alert('Success', 'Order status updated successfully');
        }}
      ]
    );
  };

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.primary as [string, string]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Orders</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.orderTime}>{order.orderTime}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.customerPhone}>{order.customerPhone}</Text>
            </View>

            <View style={styles.itemsContainer}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                </View>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
              </View>
              
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <TouchableOpacity 
                  style={styles.updateButton}
                  onPress={() => handleStatusUpdate(order.id, order.status)}
                >
                  <Text style={styles.updateButtonText}>
                    {order.status === 'ready' ? 'Mark Delivered' : 'Update Status'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.deliveryInfo}>
              <Ionicons name="location" size={16} color={Colors.textSecondary} />
              <Text style={styles.deliveryAddress}>{order.deliveryAddress}</Text>
            </View>
          </View>
        ))}

        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? 'You don\'t have any orders yet' 
                : `No ${selectedFilter} orders found`
              }
            </Text>
          </View>
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
  filterButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterContainer: {
    backgroundColor: Colors.background,
    paddingVertical: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  orderTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});
