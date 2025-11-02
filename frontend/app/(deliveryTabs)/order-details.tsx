import React from 'react';
import { View } from 'react-native';
import OrderDetailsScreen from '@/components/delivery/OrderDetailsScreen';

export default function OrderDetails() {
  // The OrderDetailsScreen will get deliveryId from useLocalSearchParams internally
  return (
    <View style={{ flex: 1 }}>
      <OrderDetailsScreen />
    </View>
  );
}

