import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useCallback } from 'react';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { PendingStoreReviewsProvider, usePendingStoreReviewsContext } from '@/contexts/PendingStoreReviewsContext';

function TabLayoutContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { visiblePendingCount, fetchPendingReviews } = usePendingStoreReviewsContext();

  useFocusEffect(
    useCallback(() => {
      fetchPendingReviews();
    }, [fetchPendingReviews])
  );

  useEffect(() => {
    if (!isLoading && user) {
      if (!user.isProfileComplete) {
        router.replace('/auth/ProfileCompletion');
        return;
      }
      if (user.role !== 'User') {
        console.log('❌ Unauthorized access to User tabs. Role:', user.role);
        if (user.role === 'Merchant') {
          router.replace('/(merchantTabs)/' as any);
        } else if (user.role === 'Delivery') {
          router.replace('/(deliveryTabs)/' as any);
        }
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.isProfileComplete || user.role !== 'User') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.navigationBackground,
          borderTopColor: Colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          title: 'Order',
          tabBarBadge: visiblePendingCount > 0 ? (visiblePendingCount > 9 ? '9+' : visiblePendingCount) : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const isCustomer = !isLoading && user?.role === 'User' && user.isProfileComplete;

  return (
    <PendingStoreReviewsProvider enabled={!!isCustomer}>
      <TabLayoutContent />
    </PendingStoreReviewsProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
