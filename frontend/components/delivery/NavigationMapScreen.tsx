import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface NavigationMapScreenProps {
  pickupLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  orderId?: string;
}

const NavigationMapScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // Parse locations from params
  const pickupLocation = params.pickupLocation 
    ? JSON.parse(params.pickupLocation as string) 
    : null;
  const deliveryLocation = params.deliveryLocation 
    ? JSON.parse(params.deliveryLocation as string) 
    : null;
  const orderId = params.orderId as string;
  const navigationType = params.navigationType as string; // 'pickup' or 'delivery'

  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState<LocationCoords[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);

  // Get user's current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for navigation');
          router.back();
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Watch location updates
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setCurrentLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            if (newLocation.coords.heading) {
              setHeading(newLocation.coords.heading);
            }
          }
        );

        setLoading(false);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Failed to get your location');
        setLoading(false);
      }
    })();
  }, []);

  // Calculate route when locations are available
  useEffect(() => {
    if (currentLocation) {
      calculateRoute();
    }
  }, [currentLocation, pickupLocation, deliveryLocation, navigationType]);

  // Fit map to show all markers
  useEffect(() => {
    if (routeCoordinates.length > 0 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeCoordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [routeCoordinates]);

  const calculateRoute = () => {
    if (!currentLocation) return;

    const destination = navigationType === 'pickup' 
      ? pickupLocation 
      : deliveryLocation;

    if (!destination) return;

    const destCoords = {
      latitude: destination.lat,
      longitude: destination.lng,
    };

    // Simple straight line route (for production, use Google Directions API)
    const route = [currentLocation, destCoords];
    setRouteCoordinates(route);

    // Calculate distance using Haversine formula
    const dist = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      destCoords.latitude,
      destCoords.longitude
    );
    setDistance(dist);

    // Estimate duration (assuming 30 km/h average speed)
    const estimatedDuration = (dist / 30) * 60; // in minutes
    setDuration(estimatedDuration);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const centerOnUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01 * ASPECT_RATIO,
        },
        1000
      );
      setFollowUser(true);
    }
  };

  const zoomIn = () => {
    // Zoom functionality can be added with region management
  };

  const zoomOut = () => {
    // Zoom functionality can be added with region management
  };

  if (loading || !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading navigation...</Text>
      </View>
    );
  }

  const destination = navigationType === 'pickup' ? pickupLocation : deliveryLocation;
  const destinationCoords = destination
    ? { latitude: destination.lat, longitude: destination.lng }
    : null;

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...currentLocation,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={true}
        followsUserLocation={followUser}
        onPanDrag={() => setFollowUser(false)}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentLocationMarker}>
              <View style={[styles.currentLocationArrow, { transform: [{ rotate: `${heading}deg` }] }]}>
                <Ionicons name="navigate" size={24} color={Colors.primary} />
              </View>
            </View>
          </Marker>
        )}

        {/* Pickup Location Marker */}
        {pickupLocation && navigationType === 'pickup' && (
          <Marker
            coordinate={{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }}
            title="Pickup Location"
            description={pickupLocation.address}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerPin, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="storefront" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.markerArrow} />
            </View>
          </Marker>
        )}

        {/* Delivery Location Marker */}
        {deliveryLocation && navigationType === 'delivery' && (
          <Marker
            coordinate={{ latitude: deliveryLocation.lat, longitude: deliveryLocation.lng }}
            title="Delivery Location"
            description={deliveryLocation.address}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerPin, { backgroundColor: '#F44336' }]}>
                <Ionicons name="location" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.markerArrow} />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Top Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.topGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {navigationType === 'pickup' ? 'Navigate to Pickup' : 'Navigate to Delivery'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {destination?.address || 'Destination'}
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Navigation Info Card */}
      <View style={styles.navInfoCard}>
        <LinearGradient
          colors={[Colors.primary, '#667eea']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.navInfoGradient}
        >
          <View style={styles.navInfoContent}>
            <View style={styles.navInfoItem}>
              <Ionicons name="navigate" size={28} color="#FFFFFF" />
              <View style={styles.navInfoTextContainer}>
                <Text style={styles.navInfoValue}>{distance.toFixed(2)} km</Text>
                <Text style={styles.navInfoLabel}>Distance</Text>
              </View>
            </View>
            <View style={styles.navInfoDivider} />
            <View style={styles.navInfoItem}>
              <Ionicons name="time" size={28} color="#FFFFFF" />
              <View style={styles.navInfoTextContainer}>
                <Text style={styles.navInfoValue}>{Math.round(duration)} min</Text>
                <Text style={styles.navInfoLabel}>ETA</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color={followUser ? Colors.primary : Colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
            <Ionicons name="add" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
            <Ionicons name="remove" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // Open external maps as fallback
            Alert.alert(
              'Open External Navigation',
              'Do you want to open this in Google Maps or Apple Maps?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Maps',
                  onPress: () => {
                    const url = Platform.select({
                      ios: `maps:0,0?q=${destination?.lat},${destination?.lng}`,
                      android: `geo:0,0?q=${destination?.lat},${destination?.lng}`,
                    });
                    if (url) {
                      Linking.openURL(url);
                    }
                  },
                },
              ]
            );
          }}
        >
          <LinearGradient
            colors={['#4CAF50', '#388E3C']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="compass" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Open External Maps</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  currentLocationMarker: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4CAF50',
    marginTop: -2,
  },
  navInfoCard: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navInfoGradient: {
    padding: 20,
  },
  navInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navInfoTextContainer: {
    alignItems: 'flex-start',
  },
  navInfoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  navInfoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  navInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  mapControls: {
    position: 'absolute',
    right: 20,
    top: 240,
    gap: 12,
  },
  mapControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomControls: {
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default NavigationMapScreen;

