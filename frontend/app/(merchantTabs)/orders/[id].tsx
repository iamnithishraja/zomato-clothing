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

  if (loading || !order) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading order...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradients.primary as [string, string]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Order #{order.orderNumber || String(order._id).slice(-8)}</Text>
            <Text style={styles.subtitle}>{totals.items} items • Qty {totals.qty}</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}><Text style={styles.summaryPillText}>{order.status}</Text></View>
          <View style={styles.summaryPill}><Text style={styles.summaryPillText}>{order.paymentMethod}</Text></View>
          <View style={styles.summaryPill}><Text style={styles.summaryPillText}>{order.paymentStatus}</Text></View>
          <View style={styles.summaryAmount}><Text style={styles.summaryAmountText}>₹{Math.round(order.totalAmount)}</Text></View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.orderItems?.map((it: any, idx: number) => {
            const image = it.product?.images?.[0];
            const available = typeof it.product?.availableQuantity === 'number' ? it.product.availableQuantity : undefined;
            const shortfall = typeof available === 'number' ? (available < it.quantity) : false;
            return (
              <View key={idx} style={[styles.cardRow, shortfall && styles.cardRowWarn]}>
                <View style={styles.cardImageBox}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, { backgroundColor: '#EEE' }]} />
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{it.product?.name || 'Product'}</Text>
                  <Text style={styles.cardMeta}>
                    Qty: {it.quantity} • Price: ₹{Math.round(it.price * it.quantity)}
                  </Text>
                  {typeof available === 'number' && (
                    <Text style={[styles.stockText, shortfall && styles.stockTextWarn]}>
                      In stock: {available}{shortfall ? ' (insufficient)' : ''}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.kv}><Text style={styles.k}>Name: </Text>{order.user?.name || '-'}</Text>
          <Text style={styles.kv}><Text style={styles.k}>Phone: </Text>{order.user?.phone || '-'}</Text>
          <Text style={styles.kv}><Text style={styles.k}>Address: </Text>{order.shippingAddress}</Text>
        </View>

        {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status History</Text>
            {order.statusHistory.map((h: any, i: number) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyStatus}>{h.status}</Text>
                <Text style={styles.historyTime}>{new Date(h.timestamp).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.footer}>
        {order.status === 'Pending' && (
          <>
            <TouchableOpacity style={[styles.btn, styles.reject]} disabled={processing} onPress={rejectOrder}>
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.accept]} disabled={processing} onPress={acceptOrder}>
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
        {(order.status === 'Accepted' || order.status === 'Processing') && (
          <TouchableOpacity style={[styles.btnFull]} disabled={processing} onPress={markReady}>
            <LinearGradient colors={Colors.gradients.primary as [string, string]} style={styles.btnFullGrad}>
              <Text style={[styles.btnText, { color: Colors.textPrimary }]}>Mark Ready for Pickup</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 12, paddingBottom: 12, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { marginTop: 4, color: Colors.textPrimary, opacity: 0.8 },
  backBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  backBtnText: { color: Colors.textPrimary, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  summaryPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  summaryPillText: { color: Colors.textPrimary, fontWeight: '700' },
  summaryAmount: { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  summaryAmountText: { color: Colors.textPrimary, fontWeight: '800' },
  content: { flex: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemName: { flex: 1, color: Colors.textPrimary, fontWeight: '600' },
  itemQty: { width: 40, textAlign: 'center', color: Colors.textSecondary, fontWeight: '700' },
  itemPrice: { width: 90, textAlign: 'right', color: Colors.textPrimary, fontWeight: '700' },
  cardRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'center' },
  cardRowWarn: { backgroundColor: '#FFF3F3' },
  cardImageBox: { width: 52, height: 52, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F2F2F2' },
  cardImage: { width: 52, height: 52, borderRadius: 8 },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { color: Colors.textSecondary, marginTop: 2 },
  stockText: { marginTop: 4, fontWeight: '700', color: '#4CAF50' },
  stockTextWarn: { color: '#E53935' },
  kv: { color: Colors.textPrimary, marginBottom: 6 },
  k: { fontWeight: '800', color: Colors.textSecondary },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyStatus: { fontWeight: '700', color: Colors.textPrimary },
  historyTime: { color: Colors.textSecondary },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  accept: { backgroundColor: '#4CAF50' },
  reject: { backgroundColor: '#F44336' },
  btnText: { color: '#FFFFFF', fontWeight: '800' },
  btnFull: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  btnFullGrad: { paddingVertical: 14, alignItems: 'center' },
});


