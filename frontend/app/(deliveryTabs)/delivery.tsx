import React from 'react';
import { View } from 'react-native';
import DeliveryDashboard from '@/components/delivery/DeliveryDashboard';

export default function DeliveryScreen() {
  return (
    <View style={{ flex: 1 }}>
      <DeliveryDashboard />
    </View>
  );
}
