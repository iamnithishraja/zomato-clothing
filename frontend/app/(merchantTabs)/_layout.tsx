import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function MerchantTabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Only allow Merchant role to access these tabs
      if (user.role !== 'Merchant') {
        console.log('❌ Unauthorized access to Merchant tabs. Role:', user.role);
        // Redirect to correct tabs based on role
        if (user.role === 'User') {
          router.replace('/(tabs)/' as any);
        } else if (user.role === 'Delivery') {
          router.replace('/(deliveryTabs)/' as any);
        }
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking role
  if (isLoading || !user || user.role !== 'Merchant') {
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
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt" color={color} size={size} />
          ),
        }}
      />
      {/* Removed Settlements route */}
            <Tabs.Screen
        name="orders/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
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
