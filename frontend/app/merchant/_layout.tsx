import { Stack } from 'expo-router';
import React from 'react';

export default function MerchantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="CreateProduct" options={{ headerShown: false }} />
      <Stack.Screen name="ProductInfo" options={{ headerShown: false }} />
    </Stack>
  );
}
