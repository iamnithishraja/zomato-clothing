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
import * as Haptics from 'expo-haptics';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const ProfileCompletion = () => {
  const router = useRouter();
  const { token, login } = useAuth();
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [role, setRole] = useState<'user' | 'merchant' | 'delivery' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));


  // Memoized validation
  const isValidName = useMemo(() => {
    return name && name.trim().length >= 2;
  }, [name]);


  const isValidGender = useMemo(() => {
    return gender !== '';
  }, [gender]);

  const isValidRole = useMemo(() => {
    return role !== '';
  }, [role]);

  const isFormValid = useMemo(() => {
    return isValidName && isValidGender && isValidRole;
  }, [isValidName, isValidGender, isValidRole]);

  const handleNameChange = useCallback((text: string) => {
    setName(text.trim());
  }, []);


  const handleGenderSelect = useCallback((selectedGender: 'male' | 'female' | 'other') => {
    setGender(selectedGender);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleRoleSelect = useCallback((selectedRole: 'user' | 'merchant' | 'delivery') => {
    setRole(selectedRole);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

      const requestData = {
        name,
        gender,
        role,
      };

      console.log('Completing profile with data:', requestData);

      const response = await apiClient.post('/api/v1/user/complete-profile', requestData);

      if (response.data.success) {
        // Update user data in context
        const { user: updatedUser } = response.data;
        await login(updatedUser, token || '');
        
        // Navigate based on user role
        if (updatedUser.role === 'merchant') {
          // For merchants, navigate to store details screen
          router.push('/auth/StoreDetails');
        } else if (updatedUser.role === 'delivery') {
          // For delivery users, navigate to delivery tabs
          router.replace('/(deliveryTabs)/' as any);
        } else {
          // For regular users, navigate to user tabs
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to complete profile. Please try again.');
      }
    } catch (error: any) {
      console.error('Profile completion error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to complete profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, isLoading, fadeAnim, name, gender, role, login, token, router]);

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
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Complete your profile to get started
            </Text>

            {/* Form Content */}
            <View style={styles.formContent}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={name ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="name"
                  />
                </View>
                {name && !isValidName && (
                  <Text style={styles.errorText}>
                    Name must be at least 2 characters long
                  </Text>
                )}
              </View>

              {/* Gender Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={styles.genderContainer}>
                  {([
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
                  ] as const).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.genderOption,
                        gender === option.value && styles.genderOptionSelected
                      ]}
                      onPress={() => handleGenderSelect(option.value)}
                    >
                      <Text style={[
                        styles.genderOptionText,
                        gender === option.value && styles.genderOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Role Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>What describes you best? *</Text>
                <Text style={styles.roleSubtitle}>Choose your primary role on our platform</Text>
                <View style={styles.roleContainer}>
                  {([
                    { 
                      value: 'user', 
                      label: 'Customer', 
                      description: 'Shop & Buy',
                      icon: 'bag-outline' 
                    },
                    { 
                      value: 'merchant', 
                      label: 'Seller', 
                      description: 'Sell Products',
                      icon: 'storefront-outline' 
                    },
                    { 
                      value: 'delivery', 
                      label: 'Delivery Partner', 
                      description: 'Deliver Orders',
                      icon: 'bicycle-outline' 
                    }
                  ] as const).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.roleOption,
                        role === option.value && styles.roleOptionSelected
                      ]}
                      onPress={() => handleRoleSelect(option.value)}
                    >
                      <View style={styles.roleIconContainer}>
                        <Ionicons 
                          name={option.icon} 
                          size={28} 
                          color={role === option.value ? Colors.textPrimary : Colors.primary}
                        />
                      </View>
                      <Text style={[
                        styles.roleOptionText,
                        role === option.value && styles.roleOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.roleDescription,
                        role === option.value && styles.roleDescriptionSelected
                      ]}>
                        {option.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>


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
                        {isLoading ? "Completing Profile..." : "Complete Profile"}
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
                  Your information is secure and encrypted
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
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
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
  genderOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  genderOptionTextSelected: {
    color: Colors.textPrimary,
  },
  roleSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  roleIconContainer: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 4,
  },
  roleOptionTextSelected: {
    color: Colors.textPrimary,
  },
  roleDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'center',
  },
  roleDescriptionSelected: {
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

export default ProfileCompletion;
