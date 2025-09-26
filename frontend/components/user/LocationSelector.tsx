import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
}

interface LocationSelectorProps {
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
}

// Mock locations data - in real app, this would come from API
const MOCK_LOCATIONS: Location[] = [
  { id: '1', name: 'Bangalore', city: 'Bangalore', state: 'Karnataka', country: 'India' },
  { id: '2', name: 'Delhi', city: 'New Delhi', state: 'Delhi', country: 'India' },
  { id: '3', name: 'Mumbai', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  { id: '4', name: 'Chennai', city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  { id: '5', name: 'Kolkata', city: 'Kolkata', state: 'West Bengal', country: 'India' },
  { id: '6', name: 'Hyderabad', city: 'Hyderabad', state: 'Telangana', country: 'India' },
  { id: '7', name: 'Pune', city: 'Pune', state: 'Maharashtra', country: 'India' },
  { id: '8', name: 'Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
];

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onLocationSelect,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = MOCK_LOCATIONS.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.locationIcon}>
          <Ionicons name="location-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Deliver to</Text>
          <Text style={styles.locationName}>
            {selectedLocation ? selectedLocation.name : 'Select Location'}
          </Text>
        </View>
        {/* <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} /> */}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <Pressable 
            style={styles.overlay} 
            onPress={() => setIsModalVisible(false)} 
          />
          
          <View style={styles.modal}>
            <LinearGradient
              colors={Colors.gradients.background as [string, string]}
              style={styles.gradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.grabber} />
                <Text style={styles.modalTitle}>Select your location</Text>
              </View>

              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
                  <TextInput
                    placeholder="Search city or area"
                    placeholderTextColor={Colors.textSecondary}
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                </View>
              </View>

              <FlatList
                data={filteredLocations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationItem,
                      selectedLocation?.id === item.id && styles.selectedLocationItem
                    ]}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <View style={styles.locationItemContent}>
                      <View style={styles.locationItemIcon}>
                        <Ionicons name="location-outline" size={20} color={Colors.primary} />
                      </View>
                      <View style={styles.locationItemInfo}>
                        <Text style={styles.locationItemName}>{item.name}</Text>
                        <Text style={styles.locationItemAddress}>
                          {item.city}, {item.state}
                        </Text>
                      </View>
                      {selectedLocation?.id === item.id && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                style={styles.locationsList}
                showsVerticalScrollIndicator={false}
              />
            </LinearGradient>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,   
  },
  locationIcon: {
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  locationName: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: 12,
    opacity: 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  locationsList: {
    flex: 1,
  },
  locationItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  selectedLocationItem: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    marginHorizontal: -4,
    paddingHorizontal: 8,
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationItemIcon: {
    marginRight: 12,
  },
  locationItemInfo: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  locationItemAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 44,
  },
});

export default LocationSelector;
