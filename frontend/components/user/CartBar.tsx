import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { Colors } from '@/constants/colors';

const formatINR = (value: number) => Math.round(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function CartBar() {
  const { count, total } = useCart();
  const router = useRouter();

  if (count <= 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.summary}>{count} item{count > 1 ? 's' : ''} • ₹{formatINR(total)}</Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/(tabs)/cart' as any)}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>View Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.select({ ios: 24, android: 16 }) as number,
    paddingTop: 8,
  },
  content: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  summary: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
