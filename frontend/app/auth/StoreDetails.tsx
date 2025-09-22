import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface BusinessHours {
  open: string;
  close: string;
  isClosed: boolean;
}

interface StoreData {
  storeName: string;
  storeDescription: string;
  address: string;
  mapLink: string;
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  businessHours: {
    monday: BusinessHours;
    tuesday: BusinessHours;
    wednesday: BusinessHours;
    thursday: BusinessHours;
    friday: BusinessHours;
    saturday: BusinessHours;
    sunday: BusinessHours;
  };
}

const StoreDetails = () => {
  const router = useRouter();
  const { token, login, user } = useAuth();
  
  const [storeData, setStoreData] = useState<StoreData>({
    storeName: '',
    storeDescription: '',
    address: '',
    mapLink: '',
    contact: {
      phone: '',
      email: '',
      website: '',
    },
    businessHours: {
      monday: { open: '09:00', close: '18:00', isClosed: false },
      tuesday: { open: '09:00', close: '18:00', isClosed: false },
      wednesday: { open: '09:00', close: '18:00', isClosed: false },
      thursday: { open: '09:00', close: '18:00', isClosed: false },
      friday: { open: '09:00', close: '18:00', isClosed: false },
      saturday: { open: '09:00', close: '18:00', isClosed: false },
      sunday: { open: '09:00', close: '18:00', isClosed: false },
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Simple validation - just check if required fields are filled
  const isFormValid = useMemo(() => {
    return storeData.storeName.trim().length >= 2 && 
           storeData.address.trim().length >= 5 && 
           storeData.mapLink.trim().length > 0;
  }, [storeData.storeName, storeData.address, storeData.mapLink]);

  const handleInputChange = useCallback((field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setStoreData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof StoreData] as any),
          [child]: value
        }
      }));
    } else {
      setStoreData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  const handleBusinessHoursChange = useCallback((day: string, field: string, value: string | boolean) => {
    setStoreData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day as keyof typeof prev.businessHours],
          [field]: value
        }
      }
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isLoading) return;

    try {
      setIsLoading(true);

      // Animate button press
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      console.log('Creating store with data:', storeData);

      const response = await apiClient.post('/api/v1/store/create', storeData);

      if (response.data.success) {
        // Update user data in context to reflect profile completion
        if (user) {
          await login({ ...user, isProfileComplete: true }, token || '');
        }
        
        Alert.alert(
          'Success!',
          'Your store details have been saved successfully.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(merchantTabs)/' as any)
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to save store details. Please try again.');
      }
    } catch (error: any) {
      console.error('Store creation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save store details. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, isLoading, fadeAnim, storeData, login, token, router, user]);

  const renderBusinessHours = () => {
    const days = [
      { key: 'monday', label: 'Mon' },
      { key: 'tuesday', label: 'Tue' },
      { key: 'wednesday', label: 'Wed' },
      { key: 'thursday', label: 'Thu' },
      { key: 'friday', label: 'Fri' },
      { key: 'saturday', label: 'Sat' },
      { key: 'sunday', label: 'Sun' },
    ];

    return (
      <View style={styles.businessHoursContainer}>
        <Text style={styles.sectionTitle}>Business Hours</Text>
        
        {/* Days Row */}
        <View style={styles.daysRow}>
          {days.map((day) => {
            const dayData = storeData.businessHours[day.key as keyof typeof storeData.businessHours];
            return (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.dayButton,
                  dayData.isClosed && styles.dayButtonClosed
                ]}
                onPress={() => handleBusinessHoursChange(day.key, 'isClosed', !dayData.isClosed)}
              >
                <Text style={[
                  styles.dayButtonText,
                  dayData.isClosed && styles.dayButtonTextClosed
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time Inputs for Open Days */}
        <View style={styles.timeInputsContainer}>
          <View style={styles.timeInputRow}>
            <Text style={styles.timeLabel}>Opening Time</Text>
            <Text style={styles.timeLabel}>Closing Time</Text>
          </View>
          
          {days.map((day) => {
            const dayData = storeData.businessHours[day.key as keyof typeof storeData.businessHours];
            return (
              <View key={day.key} style={styles.timeInputRow}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                {dayData.isClosed ? (
                  <View style={styles.closedIndicator}>
                    <Text style={styles.closedText}>Closed</Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={styles.timeInput}
                      value={dayData.open}
                      onChangeText={(value) => handleBusinessHoursChange(day.key, 'open', value)}
                      placeholder="09:00"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <TextInput
                      style={styles.timeInput}
                      value={dayData.close}
                      onChangeText={(value) => handleBusinessHoursChange(day.key, 'close', value)}
                      placeholder="18:00"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Main Content */}
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Text style={styles.title}>Complete Your Store Setup</Text>
            <Text style={styles.subtitle}>
              Add your store details to start selling on our platform
            </Text>

            {/* Form Content */}
            <View style={styles.formContent}>
              {/* Store Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Store Name *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="storefront-outline" 
                    size={20} 
                    color={storeData.storeName ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={storeData.storeName}
                    onChangeText={(value) => handleInputChange('storeName', value)}
                    placeholder="Enter your store name"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Store Description */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Store Description</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Ionicons 
                    name="document-text-outline" 
                    size={20} 
                    color={storeData.storeDescription ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={storeData.storeDescription}
                    onChangeText={(value) => handleInputChange('storeDescription', value)}
                    placeholder="Describe your store and what you sell"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Address */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Store Address *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="location-outline" 
                    size={20} 
                    color={storeData.address ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={storeData.address}
                    onChangeText={(value) => handleInputChange('address', value)}
                    placeholder="Enter your store address"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Map Link */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Map Link *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="map-outline" 
                    size={20} 
                    color={storeData.mapLink ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={storeData.mapLink}
                    onChangeText={(value) => handleInputChange('mapLink', value)}
                    placeholder="https://maps.google.com/..."
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="call-outline" 
                      size={20} 
                      color={storeData.contact.phone ? Colors.buttonPrimary : Colors.textMuted} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={storeData.contact.phone}
                      onChangeText={(value) => handleInputChange('contact.phone', value)}
                      placeholder="Store phone number"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={storeData.contact.email ? Colors.buttonPrimary : Colors.textMuted} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={storeData.contact.email}
                      onChangeText={(value) => handleInputChange('contact.email', value)}
                      placeholder="Store email address"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Website</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="globe-outline" 
                      size={20} 
                      color={storeData.contact.website ? Colors.buttonPrimary : Colors.textMuted} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={storeData.contact.website}
                      onChangeText={(value) => handleInputChange('contact.website', value)}
                      placeholder="https://yourstore.com"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>

              {/* Business Hours */}
              {renderBusinessHours()}

              {/* Submit Button */}
              <Animated.View style={{ opacity: fadeAnim }}>
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!isFormValid || isLoading) && styles.submitButtonDisabled
                  ]} 
                  onPress={handleSubmit}
                  disabled={!isFormValid || isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isFormValid ? Colors.gradients.primary as [string, string] : [Colors.border, Colors.border] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons 
                        name={isLoading ? "hourglass-outline" : "checkmark-circle-outline"} 
                        size={24} 
                        color={isFormValid ? Colors.textPrimary : Colors.textMuted}
                        style={styles.buttonIcon}
                      />
                      <Text style={[
                        styles.submitButtonText,
                        !isFormValid && styles.submitButtonTextDisabled
                      ]}>
                        {isLoading ? "Saving Store..." : "Complete Setup"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Security Info */}
              <View style={styles.securityInfo}>
                <View style={styles.securityIconContainer}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.securityText}>
                  Your store information is secure and encrypted
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  formContent: {
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  businessHoursContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayButtonClosed: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  dayButtonTextClosed: {
    color: Colors.textPrimary,
  },
  timeInputsContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 60,
    textAlign: 'center',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    width: 40,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    textAlign: 'center',
  },
  closedIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  closedText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  submitButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1.0,
  },
  submitButtonTextDisabled: {
    color: Colors.textPrimary,
    opacity: 0.7,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  securityIconContainer: {
    marginRight: 12,
    padding: 4,
  },
  securityText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default StoreDetails;