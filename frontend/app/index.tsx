import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { needsVerificationScreen } from '@/utils/verificationUtils';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('🔍 Navigation Debug:', {
          isAuthenticated,
          user: user ? {
            _id: user._id,
            name: user.name,
            role: user.role,
            isProfileComplete: user.isProfileComplete
          } : null
        });
        
        // Check if user needs to complete profile
        if (user && !user.isProfileComplete) {
          console.log('📝 User needs to complete profile, navigating to ProfileCompletion');
          // All users (including merchants) go to ProfileCompletion first
          router.replace('/auth/ProfileCompletion');
        } else if (needsVerificationScreen(user)) {
          router.replace('/auth/VerificationPending');
        } else {
          console.log('✅ User profile is complete, navigating to role-based tabs');
          if (user?.role === 'Merchant') {
            router.replace('/(merchantTabs)/' as any);
          } else if (user?.role === 'Delivery') {
            router.replace('/(deliveryTabs)/' as any);
          } else {
            router.replace('/(tabs)');
          }
        }
      } else {
        console.log('🔐 User not authenticated, navigating to Auth');
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

