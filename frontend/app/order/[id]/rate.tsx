import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OrderDetails from '@/components/user/OrderDetails';
import { Colors } from '@/constants/colors';
import { deferStoreReviewOrder } from '@/utils/storeReviewDeferUtils';

/**
 * Deep link target for post-delivery notifications: /order/{orderId}/rate
 */
export default function OrderRateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id || typeof id !== 'string') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/order')}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Rate Store</Text>
        <View style={styles.backButton} />
      </View>
      <OrderDetails
        orderId={id}
        openRatingOnMount
        onClose={() => router.replace('/(tabs)/order')}
        onReviewLater={async () => {
          await deferStoreReviewOrder(id);
          router.replace('/(tabs)/order');
        }}
        onRatingSubmitted={() => {
          router.replace('/(tabs)/order');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
