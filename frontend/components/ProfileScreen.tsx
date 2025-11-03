import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, Alert, ScrollView, TextInput, Modal, Image, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useRouter } from 'expo-router';
import apiClient from '../api/client';
import * as ImagePicker from 'expo-image-picker';
import { Region } from 'react-native-maps';
import LocationPickerScreen from '@/components/ui/LocationPickerScreen';

type ProfileScreenProps = { openStore?: boolean };

const ProfileScreen = ({ openStore }: ProfileScreenProps) => {
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const { getCurrentLocation } = useLocation();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Avatar state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Addresses state
  const initialAddresses = useMemo(() => user?.addresses || [], [user?.addresses]);
  const [addresses, setAddresses] = useState<string[]>(initialAddresses);
  const [isSavingAddresses, setIsSavingAddresses] = useState(false);

  // Address modal state
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: ''
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  // handled by LocationPickerScreen now
  const [reopenAddressAfterMap, setReopenAddressAfterMap] = useState(false);

  // Auto-open StoreDetails when requested (from merchant Home shortcut)
  const hasAutoOpenedStoreRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasAutoOpenedStoreRef.current && user?.role === 'Merchant' && openStore) {
      hasAutoOpenedStoreRef.current = true;
      router.push('/auth/StoreDetails');
    }
  }, [openStore, user?.role, router]);

  // Merchant store details preview for profile
  const [storeDetails, setStoreDetails] = useState<any | null>(null);
  React.useEffect(() => {
    const loadStoreDetails = async () => {
      try {
        if (user?.role !== 'Merchant') return;
        const resp = await apiClient.get('/api/v1/store/details');
        if (resp.data?.success) {
          setStoreDetails(resp.data.store);
        }
      } catch (_err: any) {
        // If 404, store not created yet – keep null
      }
    };
    loadStoreDetails();
  }, [user?.role]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/Auth');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'Merchant':
        return 'Merchant';
      case 'Delivery':
        return 'Delivery Partner';
      case 'User':
        return 'Customer';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Merchant':
        return 'storefront';
      case 'Delivery':
        return 'bicycle';
      case 'User':
        return 'person';
      default:
        return 'person';
    }
  };

  const handleEditProfile = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      gender: user?.gender || ''
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      const response = await apiClient.put('/api/v1/user/profile', editData);
      if (response.data.success) {
        await updateUser(response.data.user);
        setIsEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Avatar actions
  const saveAvatar = async (nextAvatar: string | null) => {
    try {
      setIsUpdating(true);
      const resp = await apiClient.put('/api/v1/user/profile', { avatar: nextAvatar });
      if (resp.data?.success) {
        await updateUser(resp.data.user);
        Alert.alert('Success', 'Avatar updated successfully!');
      } else {
        Alert.alert('Error', resp.data?.message || 'Failed to update avatar');
      }
    } catch (_err: any) {
      console.error('Avatar update error:', _err);
      Alert.alert('Error', _err.response?.data?.message || 'Failed to update avatar');
    } finally {
      setIsUpdating(false);
    }
  };

  // Image picker functionality
  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatarImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadAvatarImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploadingAvatar(true);
      
      // Derive proper filename like ImageUploader does
      const deriveFileName = (fileName?: string, uri?: string, mimeType?: string) => {
        if (fileName) return fileName;
        if (uri) {
          const parts = uri.split("/");
          const last = parts[parts.length - 1] || "";
          if (last && last.includes(".")) return last;
        }
        const timestamp = Date.now();
        const ext = mimeType?.includes('png') ? 'png' : 'jpg';
        return `avatar_${timestamp}.${ext}`;
      };

      const fileName = deriveFileName(asset.fileName || undefined, asset.uri, asset.mimeType);
      const fileType = asset.mimeType || 'image/jpeg';
      
      console.log('Uploading avatar:', { fileType, fileName, assetUri: asset.uri });
      
      // Get upload URL from backend
      const uploadResponse = await apiClient.post('/api/v1/upload/url', {
        fileType,
        fileName,
        role: 'User',
        isPermanent: true,
      });

      console.log('Upload URL response:', uploadResponse.data);

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || 'Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = uploadResponse.data;

      // Upload file to R2
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': fileType,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload file to storage');
      }

      console.log('Avatar uploaded successfully to R2');
      // Update user avatar
      await saveAvatar(publicUrl);
      
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      
      let errorMessage = 'Failed to upload avatar. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || 'Invalid image format. Please try a different image.';
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to upload images.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Addresses actions
  const persistAddresses = async (next: string[]) => {
    try {
      setIsSavingAddresses(true);
      const resp = await apiClient.put('/api/v1/user/profile', { addresses: next });
      if (resp.data?.success) {
        setAddresses(resp.data.user.addresses || []);
        await updateUser(resp.data.user);
      } else {
        Alert.alert('Error', resp.data?.message || 'Failed to save addresses');
      }
    } catch (_err: any) {
      console.error('Addresses update error:', _err);
      Alert.alert('Error', _err.response?.data?.message || 'Failed to save addresses');
    } finally {
      setIsSavingAddresses(false);
    }
  };


  const deleteAddress = async (index: number) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const next = addresses.filter((_, i) => i !== index);
        await persistAddresses(next);
      }}
    ]);
  };

  // Address modal functions
  const openAddressModal = (index?: number) => {
    if (index !== undefined) {
      // Editing existing address
      const address = addresses[index];
      const parts = address.split(', ');
      setAddressFormData({
        line1: parts[0] || '',
        line2: parts[1] || '',
        city: parts[2] || '',
        state: parts[3] || '',
        country: parts[4] || 'India',
        pincode: parts[5] || ''
      });
      setIsEditingAddress(true);
      setEditingAddressIndex(index);
    } else {
      // Adding new address
      setAddressFormData({
        line1: '',
        line2: '',
        city: '',
        state: '',
        country: 'India',
        pincode: ''
      });
      setIsEditingAddress(false);
      setEditingAddressIndex(null);
    }
    setAddressModalVisible(true);
  };

  const closeAddressModal = () => {
    setAddressModalVisible(false);
    setAddressFormData({
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    });
    setIsEditingAddress(false);
    setEditingAddressIndex(null);
  };

  const openMap = async () => {
    try {
      // Avoid nested modals on Android: close address modal and remember to reopen
      if (addressModalVisible) {
        setReopenAddressAfterMap(true);
        setAddressModalVisible(false);
      } else {
        setReopenAddressAfterMap(false);
      }
      setMapVisible(true);
      let initLat = (await getCurrentLocation())?.latitude || 12.9716;
      let initLng = (await getCurrentLocation())?.longitude || 77.5946;
      setMapRegion({
        latitude: initLat,
        longitude: initLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch {
      // noop
    } finally {
      // no-op
    }
  };

  // map region updates and geocoding are handled inside LocationPickerScreen
  const closeMap = () => {
    setMapVisible(false);
    if (reopenAddressAfterMap) {
      setAddressModalVisible(true);
      setReopenAddressAfterMap(false);
    }
  };

  const handleGetAddressFromLocation = async () => {
    try {
      setIsSavingAddresses(true);
      const locationData = await getCurrentLocation();
      
      if (locationData) {
        setAddressFormData({
          line1: locationData.landmark || locationData.street || '',
          line2: locationData.street && locationData.street !== locationData.landmark ? locationData.street : '',
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          pincode: locationData.pincode || ''
        });
        
        // Address fields filled from current location
      }
    } catch (error) {
      console.error('Error getting address from location:', error);
    } finally {
      setIsSavingAddresses(false);
    }
  };

  const saveAddressFromModal = async () => {
    const { line1, line2, city, state, country, pincode } = addressFormData;
    
    if (!line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Line 1, City, State, Pincode)');
      return;
    }

    // Create formatted address string
    const addressParts = [line1.trim()];
    if (line2.trim()) addressParts.push(line2.trim());
    addressParts.push(city.trim(), state.trim(), country.trim(), pincode.trim());
    const formattedAddress = addressParts.join(', ');

    try {
      setIsSavingAddresses(true);
      
      let updatedAddresses;
      if (isEditingAddress && editingAddressIndex !== null) {
        // Update existing address
        updatedAddresses = addresses.map((addr, i) => 
          i === editingAddressIndex ? formattedAddress : addr
        );
      } else {
        // Add new address
        if (addresses.length >= 5) {
          Alert.alert('Limit Reached', 'You can only have up to 5 addresses');
          return;
        }
        updatedAddresses = [...addresses, formattedAddress];
      }

      await persistAddresses(updatedAddresses);
      closeAddressModal();
      
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsSavingAddresses(false);
    }
  };

// Ensure hooks run before any early returns
const notAuthenticatedView = (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="person-outline" size={64} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Not Logged In</Text>
      <Text style={styles.emptyDescription}>
        Please log in to view your profile and manage your account.
      </Text>
    </View>
  </View>
);

  

  if (!user) {
    return notAuthenticatedView;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.heroHeader}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name={user.gender === 'Male' ? 'man' : user.gender === 'Female' ? 'woman' : getRoleIcon(user.role)}
                    size={50}
                    color={Colors.textPrimary}
                  />
                </View>
              )}
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={handleImagePicker}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <ActivityIndicator size={16} color={Colors.textPrimary} />
                ) : (
                  <Ionicons name="camera" size={16} color={Colors.textPrimary} />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.userInfoContainer}>
              <Text style={styles.heroName}>{user?.name || 'User'}</Text>
              <View style={styles.roleChip}>
                <Ionicons name={getRoleIcon(user?.role)} size={12} color={Colors.textPrimary} />
                <Text style={styles.roleText}>{getRoleDisplayName(user?.role)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
              </View>
              <Text style={styles.statLabel}>Profile</Text>
              <Text style={[styles.statValue, user.isProfileComplete ? { color: Colors.success } : { color: Colors.warning }]}>
                {user.isProfileComplete ? 'Complete' : 'Incomplete'}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="location" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.statLabel}>Addresses</Text>
              <Text style={styles.statValue}>{addresses.length}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statLabel}>Verified</Text>
              <Text style={styles.statValue}>
                {(user.isEmailVerified ? 1 : 0) + (user.isPhoneVerified ? 1 : 0)}/2
              </Text>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <TouchableOpacity onPress={handleEditProfile}>
                <Ionicons name="create-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.card}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="person-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{user.name || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <View style={styles.verifiedRow}>
                    <Text style={styles.infoValue}>{user.email || 'Not provided'}</Text>
                    {user.isEmailVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="call-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <View style={styles.verifiedRow}>
                    <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
                    {user.isPhoneVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="transgender-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{user.gender || 'Not specified'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Addresses Section */}
          {user.role !== 'Merchant' ? (
            // User addresses (unchanged)
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Saved Addresses</Text>
                <View style={styles.sectionHeaderRight}>
                  <Text style={styles.sectionSubtitle}>{addresses.length}/5</Text>
                  {addresses.length < 5 && (
                    <TouchableOpacity 
                      style={styles.addAddressButton}
                      onPress={() => openAddressModal()}
                    >
                      <LinearGradient
                        colors={Colors.gradients.primary as [string, string]}
                        style={styles.addAddressButtonGradient}
                      >
                        <Ionicons name="add" size={18} color={Colors.textPrimary} />
                        <Text style={styles.addAddressButtonText}>Add New Address</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.card}>
                {addresses.length === 0 ? (
                  <View style={styles.emptyAddressContainer}>
                    <Ionicons name="location-outline" size={48} color={Colors.textSecondary} />
                    <Text style={styles.emptyAddressText}>No addresses saved yet</Text>
                    <Text style={styles.emptyAddressSubtext}>Add your delivery addresses below</Text>
                  </View>
                ) : (
                  addresses.map((addr, idx) => (
                    <View key={`${addr}-${idx}`}>
                      {idx > 0 && <View style={styles.divider} />}
                      <View style={styles.addressItem}>
                        <View style={styles.addressIconBox}>
                          <Ionicons name="location" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.addressContent}>
                          <Text style={styles.addressText} numberOfLines={2}>{addr}</Text>
                          <View style={styles.addressActions}>
                            <TouchableOpacity 
                              style={styles.addressActionButton}
                              onPress={() => openAddressModal(idx)}
                            >
                              <Ionicons name="create-outline" size={16} color={Colors.primary} />
                              <Text style={styles.addressActionText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.addressActionButton, { marginLeft: 16 }]}
                              onPress={() => deleteAddress(idx)}
                            >
                              <Ionicons name="trash-outline" size={16} color={Colors.error} />
                              <Text style={[styles.addressActionText, { color: Colors.error }]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          ) : (
            // Merchant single store address preview
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Store Address</Text>
                <TouchableOpacity onPress={() => router.push('/auth/StoreDetails')}>
                  <Ionicons name="create-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                {storeDetails ? (
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Ionicons name="storefront" size={18} color={Colors.primary} />
                      <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{storeDetails.storeName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Ionicons name="location" size={18} color={Colors.primary} />
                      <Text style={{ color: Colors.textPrimary, flex: 1 }}>{storeDetails.address}</Text>
                    </View>
                    {storeDetails.mapLink ? (
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <Ionicons name="map" size={18} color={Colors.primary} />
                        <Text style={{ color: Colors.textSecondary }} numberOfLines={1}>{storeDetails.mapLink}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.emptyAddressContainer}>
                    <Ionicons name="storefront" size={48} color={Colors.textSecondary} />
                    <Text style={styles.emptyAddressText}>Store not set up</Text>
                    <Text style={styles.emptyAddressSubtext}>Add your store details to start selling</Text>
                    <View style={{ height: 12 }} />
                    <TouchableOpacity onPress={() => router.push('/auth/StoreDetails')}>
                      <LinearGradient colors={Colors.gradients.primary as [string, string]} style={styles.addAddressButtonGradient}>
                        <Ionicons name="add" size={18} color={Colors.textPrimary} />
                        <Text style={styles.addAddressButtonText}>Add Store Details</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Merchant Store Settings Shortcut */}
          {user.role === 'Merchant' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Store Settings</Text>
              </View>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.storeSettingsButton}
                  onPress={() => router.push('/auth/StoreDetails')}
                >
                  <LinearGradient
                    colors={Colors.gradients.primary as [string, string]}
                    style={styles.storeSettingsGradient}
                  >
                    <Ionicons name="storefront" size={22} color={Colors.textPrimary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeSettingsTitle}>View / Update Store</Text>
                      <Text style={styles.storeSettingsSubtitle}>Manage store info, images, working days</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LinearGradient
                colors={['#EF5350', '#E53935']}
                style={styles.logoutGradient}
              >
                <Ionicons name="log-out-outline" size={22} color={Colors.textPrimary} />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Modern Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModalSheet}>
            {/* Header */}
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>Edit Profile</Text>
                <Text style={styles.editModalSubtitle}>Update your personal information</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setIsEditModalVisible(false)} 
                activeOpacity={0.7}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={styles.editModalContent} 
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Full Name */}
              <View style={styles.modernInputGroup}>
                <Text style={styles.modernInputLabel}>Full Name</Text>
                <View style={styles.modernInputContainer}>
                  <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modernTextInput}
                    value={editData.name}
                    onChangeText={(text) => setEditData({ ...editData, name: text })}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>

              {/* Email Address - Show if user doesn't have email OR always editable */}
              <View style={styles.modernInputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.modernInputLabel}>Email Address</Text>
                  {!user?.email && <Text style={styles.optionalBadge}>Optional</Text>}
                  {user?.isEmailVerified && (
                    <View style={styles.verifiedInputBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.verifiedInputText}>Verified</Text>
                    </View>
                  )}
                </View>
                <View style={styles.modernInputContainer}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modernTextInput}
                    value={editData.email}
                    onChangeText={(text) => setEditData({ ...editData, email: text })}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!user?.isEmailVerified}
                  />
                  {user?.isEmailVerified && (
                    <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} style={styles.lockIcon} />
                  )}
                </View>
                {user?.isEmailVerified && (
                  <Text style={styles.inputHint}>Verified email cannot be changed</Text>
                )}
              </View>

              {/* Phone Number - Show if user doesn't have phone OR always editable */}
              <View style={styles.modernInputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.modernInputLabel}>Phone Number</Text>
                  {!user?.phone && <Text style={styles.optionalBadge}>Optional</Text>}
                  {user?.isPhoneVerified && (
                    <View style={styles.verifiedInputBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.verifiedInputText}>Verified</Text>
                    </View>
                  )}
                </View>
                <View style={styles.modernInputContainer}>
                  <Ionicons name="call-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modernTextInput}
                    value={editData.phone}
                    onChangeText={(text) => {
                      // Only allow digits and limit to 10
                      const cleaned = text.replace(/\D/g, '').slice(0, 10);
                      setEditData({ ...editData, phone: cleaned });
                    }}
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={10}
                    editable={!user?.isPhoneVerified}
                  />
                  {user?.isPhoneVerified && (
                    <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} style={styles.lockIcon} />
                  )}
                </View>
                {user?.isPhoneVerified ? (
                  <Text style={styles.inputHint}>Verified phone cannot be changed</Text>
                ) : editData.phone && editData.phone.length < 10 ? (
                  <Text style={[styles.inputHint, { color: Colors.error }]}>
                    Phone number must be 10 digits ({editData.phone.length}/10)
                  </Text>
                ) : null}
              </View>

              {/* Gender Selector */}
              <View style={styles.modernInputGroup}>
                <Text style={styles.modernInputLabel}>Gender</Text>
                <View style={styles.genderSelectorContainer}>
                  {(['Male', 'Female', 'Other'] as const).map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderOption,
                        editData.gender === gender && styles.genderOptionSelected
                      ]}
                      onPress={() => setEditData({ ...editData, gender })}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={
                          gender === 'Male' ? 'male' : 
                          gender === 'Female' ? 'female' : 
                          'transgender'
                        } 
                        size={20} 
                        color={editData.gender === gender ? Colors.primary : Colors.textSecondary} 
                      />
                      <Text style={[
                        styles.genderOptionText,
                        editData.gender === gender && styles.genderOptionTextSelected
                      ]}>
                        {gender}
                      </Text>
                      {editData.gender === gender && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Info Note */}
              <View style={styles.infoNote}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoNoteText}>
                  {!user?.email && !user?.phone 
                    ? 'Add email or phone for delivery notifications' 
                    : !user?.email 
                    ? 'Add email to receive order updates' 
                    : !user?.phone 
                    ? 'Add phone for delivery person contact' 
                    : 'Keep your information updated for smooth delivery'}
                </Text>
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.editModalFooter}>
              <TouchableOpacity 
                style={[styles.modernSaveButton, isUpdating && styles.modernSaveButtonDisabled]} 
                activeOpacity={0.85} 
                onPress={handleUpdateProfile} 
                disabled={isUpdating}
              >
                <LinearGradient
                  colors={isUpdating ? ['#CCCCCC', '#999999'] : Colors.gradients.primary as [string, string]}
                  style={styles.modernSaveButtonGradient}
                >
                  {isUpdating ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.textPrimary} />
                      <Text style={styles.modernSaveButtonText}>Saving...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.textPrimary} />
                      <Text style={styles.modernSaveButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Modal */}
      <Modal visible={addressModalVisible} animationType="slide" transparent onRequestClose={closeAddressModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditingAddress ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity onPress={closeAddressModal} activeOpacity={0.7}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Get Address from Location Button */}
            <TouchableOpacity
              style={styles.getLocationButton}
              onPress={handleGetAddressFromLocation}
              disabled={isSavingAddresses}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={Colors.gradients.primary as [string, string]}
                style={styles.getLocationButtonGradient}
              >
                {isSavingAddresses ? (
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                ) : (
                  <Ionicons name="locate" size={18} color={Colors.textPrimary} />
                )}
                <Text style={styles.getLocationButtonText}>
                  {isSavingAddresses ? 'Getting Location...' : 'Get Address from Current Location'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Pick on Map Button */}
            <TouchableOpacity
              style={[styles.getLocationButton, { marginTop: 0 }]}
              onPress={openMap}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={Colors.gradients.primary as [string, string]}
                style={styles.getLocationButtonGradient}
              >
                <Ionicons name="map" size={18} color={Colors.textPrimary} />
                <Text style={styles.getLocationButtonText}>Pick on Map</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address Line 1 *</Text>
              <TextInput
                style={styles.textInput}
                value={addressFormData.line1}
                onChangeText={(text) => setAddressFormData({ ...addressFormData, line1: text })}
                placeholder="House/Flat number, Street name"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address Line 2</Text>
              <TextInput
                style={styles.textInput}
                value={addressFormData.line2}
                onChangeText={(text) => setAddressFormData({ ...addressFormData, line2: text })}
                placeholder="Landmark, Area (optional)"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressFormData.city}
                  onChangeText={(text) => setAddressFormData({ ...addressFormData, city: text })}
                  placeholder="City"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>State *</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressFormData.state}
                  onChangeText={(text) => setAddressFormData({ ...addressFormData, state: text })}
                  placeholder="State"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressFormData.country}
                  onChangeText={(text) => setAddressFormData({ ...addressFormData, country: text })}
                  placeholder="Country"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Pincode *</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressFormData.pincode}
                  onChangeText={(text) => setAddressFormData({ ...addressFormData, pincode: text })}
                  placeholder="Pincode"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            <View style={styles.addressPreview}>
              <Text style={styles.previewLabel}>Address Preview:</Text>
              <Text style={styles.previewText}>
                {(() => {
                  const { line1, line2, city, state, country, pincode } = addressFormData;
                  const parts = [line1];
                  if (line2) parts.push(line2);
                  parts.push(city, state, country, pincode);
                  return parts.filter(p => p.trim()).join(', ') || 'Enter address details above';
                })()}
              </Text>
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalSaveButton} activeOpacity={0.85} onPress={saveAddressFromModal} disabled={isSavingAddresses}>
                <Text style={styles.modalSaveButtonText}>
                  {isSavingAddresses ? 'Saving...' : 'Save Address'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Map Picker */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeMap}
      >
        <LocationPickerScreen
          initialRegion={mapRegion || undefined}
          title="Choose Location"
          onClose={closeMap}
          onConfirm={({ formattedAddress }) => {
            // Map -> Address modal form
            const parts = formattedAddress.split(',').map(p => p.trim());
            setAddressFormData(prev => ({
              ...prev,
              line1: parts[0] || prev.line1,
              line2: parts[1] || prev.line2,
              city: parts[2] || prev.city,
              state: parts[3] || prev.state,
              country: parts[5] || prev.country,
              pincode: parts[4] || prev.pincode,
            }));
            setMapVisible(false);
            if (reopenAddressAfterMap) {
              setAddressModalVisible(true);
              setReopenAddressAfterMap(false);
            }
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flex: 1,
  },
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.textPrimary,
  },
  userInfoContainer: {
    flex: 1,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    padding: 20,
    marginTop: -12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addAddressButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addAddressButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addAddressButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  emptyAddressContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptyAddressSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  addressItem: {
    flexDirection: 'row',
  },
  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  addressActions: {
    flexDirection: 'row',
  },
  addressActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  addAddressContainer: {
    marginTop: 8,
  },
  addAddressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addAddressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveAddressButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveAddressGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  saveAddressText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionsSection: {
    marginTop: 8,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  storeSettingsButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  storeSettingsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  storeSettingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  storeSettingsSubtitle: {
    fontSize: 12,
    color: Colors.textPrimary,
    opacity: 0.8,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  // Modern Edit Profile Modal Styles
  editModalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  editModalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modernInputGroup: {
    marginBottom: 20,
  },
  modernInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedInputBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  verifiedInputText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  modernTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  lockIcon: {
    marginLeft: 8,
  },
  inputHint: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 6,
    marginLeft: 4,
  },
  genderSelectorContainer: {
    gap: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  genderOptionSelected: {
    backgroundColor: '#E6F4FE',
    borderColor: Colors.primary,
  },
  genderOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderOptionTextSelected: {
    color: Colors.primary,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6F4FE',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
    lineHeight: 18,
  },
  editModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modernSaveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modernSaveButtonDisabled: {
    opacity: 0.6,
  },
  modernSaveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  modernSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  getLocationButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  getLocationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  getLocationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  addressInputHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#E0E0E0',
  },
  avatarPreviewPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  removeAvatarButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  removeAvatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Address Modal Styles
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addressPreview: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

export default ProfileScreen; 