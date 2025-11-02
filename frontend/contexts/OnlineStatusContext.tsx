import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useLocationTracking } from '@/hooks/useLocationTracking';

interface OnlineStatusContextType {
  isOnline: boolean;
  isTracking: boolean;
  toggleOnlineStatus: () => Promise<void>;
  setOnline: (status: boolean) => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

const ONLINE_STATUS_KEY = '@delivery_online_status';

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnlineState] = useState(false);
  const { isTracking, startTracking: startLocationTracking, stopTracking: stopLocationTracking } = useLocationTracking({ 
    enableTracking: false 
  });

  // Load saved online status on mount
  useEffect(() => {
    const loadOnlineStatus = async () => {
      try {
        const savedStatus = await AsyncStorage.getItem(ONLINE_STATUS_KEY);
        if (savedStatus !== null) {
          const status = JSON.parse(savedStatus);
          setIsOnlineState(status);
          if (status) {
            // If was online, restart tracking
            await startLocationTracking();
          }
        }
      } catch (error) {
        console.error('Error loading online status:', error);
      }
    };
    loadOnlineStatus();
  }, []);

  // Save online status whenever it changes
  const setOnline = useCallback(async (status: boolean) => {
    try {
      await AsyncStorage.setItem(ONLINE_STATUS_KEY, JSON.stringify(status));
      setIsOnlineState(status);
    } catch (error) {
      console.error('Error saving online status:', error);
    }
  }, []);

  const toggleOnlineStatus = useCallback(async () => {
    if (!isOnline) {
      // Going online - start location tracking
      Alert.alert(
        'Go Online',
        'Start accepting delivery orders? Location tracking will be enabled.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Online',
            onPress: async () => {
              try {
                await startLocationTracking();
                await setOnline(true);
                Alert.alert('Success', 'You are now online and accepting orders!');
              } catch (error) {
                console.error('Error going online:', error);
                Alert.alert('Error', 'Failed to go online. Please try again.');
              }
            }
          }
        ]
      );
    } else {
      // Going offline - stop location tracking
      Alert.alert(
        'Go Offline',
        'Stop accepting new delivery orders?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Offline',
            onPress: async () => {
              try {
                await stopLocationTracking();
                await setOnline(false);
                Alert.alert('Success', 'You are now offline');
              } catch (error) {
                console.error('Error going offline:', error);
                Alert.alert('Error', 'Failed to go offline. Please try again.');
              }
            }
          }
        ]
      );
    }
  }, [isOnline, startLocationTracking, stopLocationTracking, setOnline]);

  return (
    <OnlineStatusContext.Provider 
      value={{ 
        isOnline, 
        isTracking, 
        toggleOnlineStatus, 
        setOnline,
        startTracking: startLocationTracking,
        stopTracking: stopLocationTracking
      }}
    >
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within OnlineStatusProvider');
  }
  return context;
};

