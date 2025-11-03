import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';

const formatINR = (value: number) => Math.round(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function DeliverySettlementScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [codSummary, setCodSummary] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Compute date range based on selectedPeriod
      const end = new Date();
      const start = new Date(end);
      if (selectedPeriod === 'week') {
        start.setDate(end.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        start.setMonth(end.getMonth() - 1);
      } else {
        // 'all' -> fallback to a wide range
        start.setFullYear(end.getFullYear() - 5);
      }

      const [codResp, statsResp] = await Promise.all([
        apiClient.get('/api/v1/cod/summary'),
        apiClient.get('/api/v1/delivery/stats/overview', {
          params: { startDate: start.toISOString(), endDate: end.toISOString() }
        })
      ]);

      if (codResp.data?.success) {
        setCodSummary(codResp.data.summary);
      }
      if (statsResp.data?.success) {
        setStats(statsResp.data.stats);
      }
    } catch (error: any) {
      console.error('Error loading settlement data:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const periodFilters = [
    { key: 'week' as const, label: 'This Week' },
    { key: 'month' as const, label: 'This Month' },
    { key: 'all' as const, label: 'All Time' },
  ];

  if (loading && !codSummary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading settlement data...</Text>
      </View>
    );
  }

  // Derived values
  const totalDeliveryEarnings = stats?.totalEarnings || 0;
  const completedDeliveries = stats?.completed || 0;
  const codCollectedNotSubmitted = codSummary?.collectedNotSubmitted?.amount || 0;
  const codSubmitted = codSummary?.submitted?.amount || 0;
  const totalCodCollected = codSummary?.totalCollected?.amount || 0;
  const codPendingCount = codSummary?.collectedNotSubmitted?.count || 0;
  const onlinePayments = stats?.onlinePaymentEarnings || 0;

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={Colors.gradients.primary as [string, string]}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerTitle}>My Settlements</Text>
          <Text style={styles.headerSubtitle}>Track your earnings and collections</Text>
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
        {/* Period Filters */}
        <View style={styles.filtersContainer}>
          {periodFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedPeriod === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedPeriod(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedPeriod === filter.key && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Delivery Earnings */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryIconContainer}>
              <Ionicons name="bicycle" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Delivery Earnings</Text>
              <Text style={styles.summaryAmount}>
                ₹{formatINR(totalDeliveryEarnings)}
              </Text>
              <Text style={styles.summarySubtext}>
                From {completedDeliveries} completed deliveries
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* COD To Submit */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryIconContainer}>
              <Ionicons name="wallet" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>COD To Submit</Text>
              <Text style={styles.summaryAmount}>
                ₹{formatINR(codCollectedNotSubmitted)}
              </Text>
              <Text style={styles.summarySubtext}>
                {codPendingCount} pending {codPendingCount === 1 ? 'collection' : 'collections'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Payment Breakdown */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Total COD Collected</Text>
            </View>
            <Text style={styles.infoValue}>
              ₹{formatINR(totalCodCollected)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="checkmark-done-outline" size={20} color={Colors.success} />
              <Text style={styles.infoLabel}>COD Submitted</Text>
            </View>
            <Text style={styles.infoValue}>
              ₹{formatINR(codSubmitted)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="card-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Online Payments</Text>
            </View>
            <Text style={styles.infoValue}>
              ₹{formatINR(onlinePayments)}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowTotal]}>
            <View style={styles.infoLeft}>
              <Ionicons name="trophy-outline" size={20} color={Colors.success} />
              <Text style={styles.infoLabelBold}>Total Earnings</Text>
            </View>
            <Text style={styles.infoValueBold}>
              ₹{formatINR(totalDeliveryEarnings)}
            </Text>
          </View>
        </View>

        {/* Pending COD Collections Detail */}
        {codPendingCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending COD Collections</Text>
            <View style={styles.codListCard}>
              {codSummary?.collectedNotSubmitted?.payments?.map((payment: any) => (
                <View key={payment._id} style={styles.codListItem}>
                  <View style={styles.codItemLeft}>
                    <Ionicons name="receipt-outline" size={20} color={Colors.textSecondary} />
                    <View style={styles.codItemInfo}>
                      <Text style={styles.codItemOrder}>
                        Order #{payment.order?.orderNumber || String(payment.order?._id || '').slice(-8)}
                      </Text>
                      <Text style={styles.codItemDate}>
                        {payment.collectedAt ? formatDate(payment.collectedAt) : 'Collected'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.codItemAmount}>₹{formatINR(payment.amount)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.codInfoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.warning} />
              <Text style={styles.codInfoText}>
                Submit collected COD to the platform to complete settlement
              </Text>
            </View>
          </View>
        )}

        {/* Stats Overview */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                <Text style={styles.statValue}>{stats.completed || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={28} color={Colors.warning} />
                <Text style={styles.statValue}>{stats.pending || 0}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="close-circle" size={28} color={Colors.error} />
                <Text style={styles.statValue}>{stats.cancelled || 0}</Text>
                <Text style={styles.statLabel}>Cancelled</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star" size={28} color="#FFD700" />
                <Text style={styles.statValue}>{stats.averageRating?.toFixed(1) || 'N/A'}</Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            </View>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need Help with Settlements?</Text>
            <Text style={styles.helpText}>
              Contact support for any queries regarding COD collections, earnings, or settlements.
            </Text>
            <TouchableOpacity style={styles.helpButton}>
              <Text style={styles.helpButtonText}>Contact Support</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
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
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  summaryGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoRowTotal: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 0,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoValueBold: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  codListCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  codListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  codItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  codItemInfo: {
    gap: 4,
  },
  codItemOrder: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  codItemDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  codItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
  codInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  codInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  helpCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});


