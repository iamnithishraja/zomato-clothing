import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Check if user needs to complete profile
        if (user && !user.isProfileComplete) {
          // All users (including merchants) go to ProfileCompletion first
          router.replace('/auth/ProfileCompletion');
        } else {
          // Navigate to appropriate tabs based on user role
          if (user?.role === 'merchant') {
            router.replace('/(merchantTabs)/' as any);
          } else if (user?.role === 'delivery') {
            router.replace('/(deliveryTabs)/' as any);
          } else {
            router.replace('/(tabs)');
          }
        }
      } else {
        router.replace('/auth/Auth');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

