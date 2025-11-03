import React from 'react';
import { View, StyleSheet } from 'react-native';

interface NavigationMarkerProps {
  type: 'current' | 'pickup' | 'delivery';
  size?: number;
}

const NavigationMarker: React.FC<NavigationMarkerProps> = ({ 
  type, 
  size = 20,
}) => {
  // Define colors for each marker type
  const markerColor = type === 'current' 
    ? '#4285F4'  // Blue for user
    : type === 'pickup' 
    ? '#4CAF50'  // Green for store/pickup
    : '#F44336'; // Red for delivery

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size 
        }
      ]}
      pointerEvents="none"
      collapsable={false}
    >
      {/* Simple colored dot */}
      <View style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: markerColor,
        }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dot: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default NavigationMarker;

