import React from 'react';
import { View } from 'react-native';
import OrderManagement from '@/components/merchant/OrderManagement';

export default function MerchantOrdersScreen() {
  return (
    <View style={{ flex: 1 }}>
      <OrderManagement />
    </View>
  );
}

