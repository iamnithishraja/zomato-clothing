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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
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

const SettlementScreen: React.FC = () => {
  const [settlementData, setSettlementData] = useState<any>(null);
  const [payoutSummary, setPayoutSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  const loadSettlementData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load settlement report
      const reportResponse = await apiClient.get('/api/v1/settlement/report', {
        params: { period: selectedPeriod }
      });
      
      // Load payout summary
      const payoutResponse = await apiClient.get('/api/v1/settlement/payout-summary');
      
      if (reportResponse.data.success) {
        setSettlementData(reportResponse.data);
      }
      
      if (payoutResponse.data.success) {
        setPayoutSummary(payoutResponse.data);
      }
    } catch (error: any) {
      console.error('Error loading settlement data:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSettlementData();
    setRefreshing(false);
  }, [loadSettlementData]);

  useEffect(() => {
    loadSettlementData();
  }, [loadSettlementData]);

  const periodFilters = [
    { key: 'week' as const, label: 'This Week' },
    { key: 'month' as const, label: 'This Month' },
    { key: 'all' as const, label: 'All Time' },
  ];

  if (loading && !settlementData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading settlement data...</Text>
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
          <Text style={styles.headerTitle}>Settlements</Text>
          <Text style={styles.headerSubtitle}>Track your earnings and payouts</Text>
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

        {/* Summary Cards */}
        {settlementData && (
          <>
            {/* Total Earnings */}
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="wallet-outline" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Total Earnings</Text>
                  <Text style={styles.summaryAmount}>
                    ₹{formatINR(settlementData.totalEarnings || 0)}
                  </Text>
                  <Text style={styles.summarySubtext}>
                    From {settlementData.totalOrders || 0} completed orders
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Pending Settlement */}
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={['#FFA500', '#FF8C00']}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="time-outline" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Pending Settlement</Text>
                  <Text style={styles.summaryAmount}>
                    ₹{formatINR(settlementData.pendingAmount || 0)}
                  </Text>
                  <Text style={styles.summarySubtext}>
                    From {settlementData.pendingOrders || 0} orders
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Platform Commission */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                  <Text style={styles.infoLabel}>Platform Commission</Text>
                </View>
                <Text style={styles.infoValue}>
                  ₹{formatINR(settlementData.totalCommission || 0)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="card-outline" size={20} color={Colors.primary} />
                  <Text style={styles.infoLabel}>Transaction Fees</Text>
                </View>
                <Text style={styles.infoValue}>
                  ₹{formatINR(settlementData.totalTransactionFees || 0)}
                </Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowTotal]}>
                <View style={styles.infoLeft}>
                  <Ionicons name="cash-outline" size={20} color={Colors.success} />
                  <Text style={styles.infoLabelBold}>Net Earnings</Text>
                </View>
                <Text style={styles.infoValueBold}>
                  ₹{formatINR((settlementData.totalEarnings || 0) - (settlementData.totalCommission || 0) - (settlementData.totalTransactionFees || 0))}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Payout Summary */}
        {payoutSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Payouts</Text>
            
            {payoutSummary.payouts && payoutSummary.payouts.length > 0 ? (
              payoutSummary.payouts.map((payout: any, index: number) => (
                <View key={index} style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <View style={styles.payoutLeft}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                      <View style={styles.payoutInfo}>
                        <Text style={styles.payoutDate}>{formatDate(payout.date)}</Text>
                        <Text style={styles.payoutId}>Payout ID: {payout.id}</Text>
                      </View>
                    </View>
                    <Text style={styles.payoutAmount}>₹{formatINR(payout.amount)}</Text>
                  </View>
                  
                  {payout.orders && (
                    <Text style={styles.payoutOrders}>
                      {payout.orders} orders included
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyPayoutCard}>
                <Ionicons name="wallet-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyPayoutText}>No payouts yet</Text>
                <Text style={styles.emptyPayoutSubtext}>
                  Payouts are processed weekly for completed orders
                </Text>
              </View>
            )}
          </View>
        )}

        {/* COD Summary */}
        {settlementData && settlementData.codOrders > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cash on Delivery</Text>
            <View style={styles.codCard}>
              <View style={styles.codRow}>
                <Text style={styles.codLabel}>Total COD Orders</Text>
                <Text style={styles.codValue}>{settlementData.codOrders}</Text>
              </View>
              <View style={styles.codRow}>
                <Text style={styles.codLabel}>COD Amount Collected</Text>
                <Text style={styles.codValueAmount}>
                  ₹{formatINR(settlementData.codCollected || 0)}
                </Text>
              </View>
              <View style={styles.codRow}>
                <Text style={styles.codLabel}>Pending Collection</Text>
                <Text style={[styles.codValueAmount, { color: Colors.warning }]}>
                  ₹{formatINR(settlementData.codPending || 0)}
                </Text>
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
              Contact support for any queries regarding payouts and settlements.
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
  payoutCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payoutInfo: {
    gap: 4,
  },
  payoutDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  payoutId: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
  payoutOrders: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyPayoutCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyPayoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptyPayoutSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  codCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  codRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  codLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  codValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  codValueAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
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

export default SettlementScreen;

