import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import apiClient from '@/api/client';

interface LocationCoords {
  lat: number;
  lng: number;
}

interface UseLocationTrackingOptions {
  enableTracking: boolean; // Whether to start tracking automatically
  updateInterval?: number; // Interval in milliseconds (default: 5000 = 5 seconds)
}

export const useLocationTracking = (options: UseLocationTrackingOptions = { enableTracking: false }) => {
  const { enableTracking, updateInterval = 5000 } = options;
  
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const updateTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSentLocation = useRef<LocationCoords | null>(null);

  // Request location permissions
  const requestPermissions = useCallback(async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setPermissionStatus('denied');
        setError('Location permission denied');
        return false;
      }

      // Request background location for better tracking (optional for delivery partners)
      try {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus === 'granted') {
          console.log('✅ Background location permission granted');
        } else {
          console.log('⚠️ Background location permission denied - foreground tracking will be used');
        }
      } catch (bgError) {
        console.log('ℹ️ Background location not available - using foreground tracking only');
        // This is not critical - foreground tracking will still work
      }

      setPermissionStatus('granted');
      setError(null);
      return true;
    } catch (err) {
      console.error('Error requesting location permissions:', err);
      setError('Failed to request location permissions');
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  // Send location update to backend
  const sendLocationUpdate = useCallback(async (location: LocationCoords) => {
    try {
      // Avoid sending duplicate locations
      if (
        lastSentLocation.current &&
        lastSentLocation.current.lat === location.lat &&
        lastSentLocation.current.lng === location.lng
      ) {
        return;
      }

      await apiClient.patch('/api/v1/delivery/location', {
        lat: location.lat,
        lng: location.lng
      });

      lastSentLocation.current = location;
      console.log('✅ Location updated:', location);
    } catch (err: any) {
      console.error('❌ Failed to send location update:', err);
      // Don't set error state to avoid UI disruption - just log it
    }
  }, []);

  // Start tracking location
  const startTracking = useCallback(async () => {
    if (isTracking) {
      console.log('Location tracking already active');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      setIsTracking(true);
      setError(null);

      // Start watching location changes
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          const coords: LocationCoords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          setCurrentLocation(coords);
        }
      );

      // Set up periodic backend updates
      updateTimer.current = setInterval(() => {
        if (currentLocation) {
          sendLocationUpdate(currentLocation);
        }
      }, updateInterval);

      console.log('✅ Location tracking started');
    } catch (err: any) {
      console.error('Error starting location tracking:', err);
      setError('Failed to start location tracking');
      setIsTracking(false);
    }
  }, [isTracking, requestPermissions, sendLocationUpdate, updateInterval, currentLocation]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (updateTimer.current) {
      clearInterval(updateTimer.current);
      updateTimer.current = null;
    }

    setIsTracking(false);
    console.log('🛑 Location tracking stopped');
  }, []);

  // Get current location once (without continuous tracking)
  const getCurrentLocation = useCallback(async (): Promise<LocationCoords | null> => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: LocationCoords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setCurrentLocation(coords);
      return coords;
    } catch (err: any) {
      console.error('Error getting current location:', err);
      setError('Failed to get current location');
      return null;
    }
  }, [requestPermissions]);

  // Auto-start tracking if enableTracking is true
  useEffect(() => {
    if (enableTracking && !isTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enableTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    currentLocation,
    isTracking,
    error,
    permissionStatus,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermissions,
  };
};

