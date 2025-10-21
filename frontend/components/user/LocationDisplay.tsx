import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useLocation } from '@/contexts/LocationContext';

interface LocationDisplayProps {
  onPress?: () => void;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ onPress }) => {
  const { selectedCity, currentLocation } = useLocation();

  const displayCity = selectedCity || currentLocation?.city || 'Select Location';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.locationIcon}>
        <Ionicons name="location" size={16} color={Colors.primary} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.deliveryText}>Delivering to</Text>
        <Text style={styles.cityText}>{displayCity}</Text>
      </View>
      <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },
  deliveryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cityText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 1,
  },
});

export default LocationDisplay;
