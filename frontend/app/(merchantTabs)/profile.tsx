import React from 'react';
import ProfileScreen from '@/components/ProfileScreen';
import { useLocalSearchParams } from 'expo-router';

export default function MerchantProfile() {
  const params = useLocalSearchParams();
  return <ProfileScreen openStore={params?.openStore === 'true'} />;
}
