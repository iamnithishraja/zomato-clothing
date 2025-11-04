import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function DeliveryTabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Only allow Delivery role to access these tabs
      if (user.role !== 'Delivery') {
        console.log('❌ Unauthorized access to Delivery tabs. Role:', user.role);
        // Redirect to correct tabs based on role
        if (user.role === 'User') {
          router.replace('/(tabs)/' as any);
        } else if (user.role === 'Merchant') {
          router.replace('/(merchantTabs)/' as any);
        }
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking role
  if (isLoading || !user || user.role !== 'Delivery') {
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
        name="delivery"
        options={{
          title: 'Delivery',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle" color={color} size={size} />
          ),
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
      {/* Removed Settlements route */}
      {/* Hidden Order Details screen - accessible via navigation only */}
      <Tabs.Screen
        name="order-details"
        options={{
          href: null,
        }}
      />
      {/* Hidden Navigation Map screen - accessible via navigation only */}
      <Tabs.Screen
        name="navigation-map"
        options={{
          href: null,
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
