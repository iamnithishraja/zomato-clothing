import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { Region } from 'react-native-maps';
import { useLocation } from '@/contexts/LocationContext';
import LocationPickerScreen from '@/components/ui/LocationPickerScreen';

interface Address {
  id: string;
  address: string;
  isDefault?: boolean;
}

interface AddressSelectorProps {
  selectedAddress: string | null;
  onAddressSelect: (address: string) => void;
  onAddNewAddress: (address: string) => void;
}

export default function AddressSelector({ 
  selectedAddress, 
  onAddressSelect, 
  onAddNewAddress 
}: AddressSelectorProps) {
  const { user } = useAuth();
  const { currentLocation, getCurrentLocation } = useLocation();
  const [modalVisible, setModalVisible] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  useEffect(() => {
    if (modalVisible) {
      loadAddresses();
    }
  }, [modalVisible]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/v1/user/profile');
      
      if (response.data.success && response.data.user.addresses) {
        const userAddresses = response.data.user.addresses.map((addr: string, index: number) => ({
          id: `addr_${index}`,
          address: addr,
          isDefault: index === 0 // First address is default
        }));
        setAddresses(userAddresses);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (address: string) => {
    onAddressSelect(address);
    setModalVisible(false);
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.put('/api/v1/user/profile', {
        addresses: [...(user?.addresses || []), newAddress.trim()]
      });

      if (response.data.success) {
        onAddNewAddress(newAddress.trim());
        setNewAddress('');
        setShowAddForm(false);
        setModalVisible(false);
        Alert.alert('Success', 'Address added successfully');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayText = () => {
    if (selectedAddress) {
      return selectedAddress.length > 50 
        ? selectedAddress.substring(0, 50) + '...' 
        : selectedAddress;
    }
    return 'Select delivery address';
  };

  const openMap = useCallback(async () => {
    try {
      // Initialize region from current location or a sensible default
      let initLat = currentLocation?.latitude ?? 12.9716; // Bengaluru default
      let initLng = currentLocation?.longitude ?? 77.5946;
      if (!currentLocation) {
        const loc = await getCurrentLocation();
        if (loc) {
          initLat = loc.latitude;
          initLng = loc.longitude;
        }
      }
      setMapRegion({
        latitude: initLat,
        longitude: initLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setMapVisible(true);
    } catch {
      // noop
    }
  }, [currentLocation, getCurrentLocation]);

  const confirmPickedAddress = async (params: { latitude: number; longitude: number; formattedAddress: string }) => {
    setNewAddress(params.formattedAddress);
    setMapVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <View style={styles.selectorLeft}>
            <Ionicons 
              name="location-outline" 
              size={20} 
              color={selectedAddress ? Colors.buttonPrimary : Colors.textMuted} 
            />
            <View style={styles.selectorText}>
              <Text style={[
                styles.selectorLabel,
                { color: selectedAddress ? Colors.textPrimary : Colors.textMuted }
              ]}>
                {selectedAddress ? 'Delivery Address' : 'Select Delivery Address'}
              </Text>
              <Text style={[
                styles.selectorValue,
                { color: selectedAddress ? Colors.textPrimary : Colors.textMuted }
              ]}>
                {getDisplayText()}
              </Text>
            </View>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={Colors.textMuted} 
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Address</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading addresses...</Text>
              </View>
            ) : (
              <>
                {addresses.length > 0 ? (
                  <>
                    {addresses.map((address) => (
                      <TouchableOpacity
                        key={address.id}
                        style={[
                          styles.addressItem,
                          selectedAddress === address.address && styles.selectedAddress
                        ]}
                        onPress={() => handleAddressSelect(address.address)}
                      >
                        <View style={styles.addressContent}>
                          <View style={styles.addressHeader}>
                            <Text style={styles.addressText}>{address.address}</Text>
                            {address.isDefault && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultText}>Default</Text>
                              </View>
                            )}
                          </View>
                          {selectedAddress === address.address && (
                            <Ionicons name="checkmark-circle" size={20} color={Colors.buttonPrimary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="location-outline" size={48} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>No addresses saved</Text>
                    <Text style={styles.emptySubtitle}>
                      Add your first address to get started
                    </Text>
                  </View>
                )}

                {!showAddForm ? (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddForm(true)}
                  >
                    <Ionicons name="add" size={20} color={Colors.buttonPrimary} />
                    <Text style={styles.addButtonText}>Add New Address</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.addForm}>
                    <Text style={styles.addFormTitle}>Add New Address</Text>
                    <TouchableOpacity style={styles.mapPickButton} onPress={openMap}>
                      <Ionicons name="map" size={18} color={Colors.buttonPrimary} />
                      <Text style={styles.mapPickButtonText}>Pick on Map</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.addressInput}
                      placeholder="Enter complete address with landmark"
                      value={newAddress}
                      onChangeText={setNewAddress}
                      multiline
                      numberOfLines={4}
                      placeholderTextColor={Colors.textMuted}
                    />
                    <View style={styles.addFormActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowAddForm(false);
                          setNewAddress('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveButton, !newAddress.trim() && styles.saveButtonDisabled]}
                        onPress={handleAddNewAddress}
                        disabled={!newAddress.trim() || isLoading}
                      >
                        <Text style={styles.saveButtonText}>
                          {isLoading ? 'Saving...' : 'Save Address'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Optimized Map Picker Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setMapVisible(false)}
      >
        <LocationPickerScreen
          initialRegion={mapRegion || undefined}
          title="Choose Location"
          onClose={() => setMapVisible(false)}
          onConfirm={confirmPickedAddress}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    marginLeft: 12,
    flex: 1,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  addressItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedAddress: {
    borderColor: Colors.buttonPrimary,
    backgroundColor: Colors.primary + '10',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: Colors.buttonPrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.buttonPrimary,
    marginLeft: 8,
  },
  addForm: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  mapPickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    backgroundColor: Colors.background,
  },
  mapPickButtonText: {
    marginLeft: 6,
    color: Colors.buttonPrimary,
    fontWeight: '600',
  },
  addressInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  addFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.buttonPrimary,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
