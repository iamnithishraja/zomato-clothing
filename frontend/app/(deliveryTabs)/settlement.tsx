import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/api/client';

const formatINR = (value: number) => Math.round(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function DeliverySettlementScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [codResp, statsResp] = await Promise.all([
        apiClient.get('/api/v1/cod/summary'),
        apiClient.get('/api/v1/delivery/stats/overview')
      ]);
      if (codResp.data?.success) setSummary(codResp.data.summary);
      if (statsResp.data?.success) setStats(statsResp.data.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading settlements...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>Settlements</Text>
      <Text style={styles.headerSubtitle}>COD collections and delivery earnings</Text>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Ionicons name="wallet" size={22} color={Colors.success} />
          <Text style={styles.cardValue}>₹{formatINR(summary?.collectedNotSubmitted?.amount || 0)}</Text>
          <Text style={styles.cardLabel}>COD To Submit</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="checkmark-done" size={22} color={Colors.primary} />
          <Text style={styles.cardValue}>₹{formatINR(summary?.submitted?.amount || 0)}</Text>
          <Text style={styles.cardLabel}>COD Submitted</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Ionicons name="cash" size={22} color={Colors.warning} />
          <Text style={styles.cardValue}>₹{formatINR(summary?.totalCollected?.amount || 0)}</Text>
          <Text style={styles.cardLabel}>Total COD Collected</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="bicycle" size={22} color={Colors.success} />
          <Text style={styles.cardValue}>₹{formatINR(stats?.totalEarnings || 0)}</Text>
          <Text style={styles.cardLabel}>Delivery Earnings</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending COD Payments</Text>
        {summary?.collectedNotSubmitted?.payments?.length ? (
          summary.collectedNotSubmitted.payments.map((p: any) => (
            <View key={p._id} style={styles.listItem}>
              <Text style={styles.itemLeft}>Order #{p.order?.orderNumber || String(p.order?._id || '').slice(-8)}</Text>
              <Text style={styles.itemRight}>₹{formatINR(p.amount)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No pending COD to submit</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20, paddingTop: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.textSecondary },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: Colors.backgroundSecondary, borderRadius: 16, padding: 16, alignItems: 'center' },
  cardValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  cardLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemLeft: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  itemRight: { fontSize: 14, color: Colors.textPrimary, fontWeight: '700' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});


