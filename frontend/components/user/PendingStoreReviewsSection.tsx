import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { PendingStoreReviewOrder } from '@/types/storeReview';

interface PendingStoreReviewsSectionProps {
  orders: PendingStoreReviewOrder[];
  totalPending: number;
  isLoading?: boolean;
  onRatePress: (orderId: string) => void;
  onLaterPress: (orderId: string) => void;
  onViewAllPress?: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const PendingStoreReviewsSection: React.FC<PendingStoreReviewsSectionProps> = ({
  orders,
  totalPending,
  isLoading,
  onRatePress,
  onLaterPress,
  onViewAllPress,
}) => {
  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (totalPending === 0 || orders.length === 0) {
    return null;
  }

  const displayOrders = orders.slice(0, 5);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.sectionTitle}>Pending Store Reviews</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalPending}</Text>
          </View>
        </View>
        {totalPending > displayOrders.length && onViewAllPress && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionSubtitle}>
        Rate your recent orders, or tap Later — you can always review from order details.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {displayOrders.map((order) => (
          <View key={order._id} style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="storefront" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.storeName} numberOfLines={2}>
              {typeof order.store === 'object' ? order.store.storeName : 'Store'}
            </Text>
            <Text style={styles.orderMeta}>
              Order #{order.orderNumber || order._id.slice(-8)}
            </Text>
            <Text style={styles.orderMeta}>
              Delivered {formatDate(order.deliveryDate || order.updatedAt)}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.rateButton} onPress={() => onRatePress(order._id)}>
                <Ionicons name="star-outline" size={16} color={Colors.textPrimary} />
                <Text style={styles.rateButtonText}>Rate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.laterButton} onPress={() => onLaterPress(order._id)}>
                <Text style={styles.laterButtonText}>Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 14,
    lineHeight: 18,
  },
  cardsRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  card: {
    width: 200,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    minHeight: 36,
  },
  orderMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  rateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  rateButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  laterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  laterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

export default PendingStoreReviewsSection;
