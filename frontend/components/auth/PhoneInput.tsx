import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Country, DEFAULT_COUNTRY } from '@/constants/country';
import CountryDropdown from './CountryDropdown';

interface PhoneInputProps {
  phoneNumber: string;
  onPhoneChange: (text: string) => void;
  isValid: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ phoneNumber, onPhoneChange, isValid }) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const inputRef = useRef<View>(null);

  // Show fade effect on component mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Optimized phone number formatting
  const formatPhoneNumber = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
    }
    return cleaned.slice(0, 10).replace(/(\d{5})(\d{5})/, '$1 $2');
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    const formatted = formatPhoneNumber(text);
    onPhoneChange(formatted);
  }, [formatPhoneNumber, onPhoneChange]);

  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  }, []);

  const handleCountryPress = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        setInputPosition({ x: pageX, y: pageY, width, height });
        setShowCountryPicker(true);
      });
    }
  }, []);

  return (
    <Animated.View 
      style={[
        styles.inputSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Error message on top */}
      {phoneNumber.length > 0 && !isValid && (
        <Text style={styles.errorText}>Please enter a valid 10-digit mobile number</Text>
      )}
      
      <View ref={inputRef} style={styles.inputContainer}>
        <Pressable 
          style={styles.countryCodeContainer}
          onPress={handleCountryPress}
        >
          <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCode}>{selectedCountry.dialCode}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </Pressable>
        <TextInput
          style={styles.phoneInput}
          placeholder="Enter mobile number"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={11}
          autoFocus
        />
      </View>

      <Text style={styles.helperText}>We&apos;ll send a verification code</Text>

      {/* Country Dropdown */}
      <CountryDropdown
        selectedCountry={selectedCountry}
        onSelect={handleCountrySelect}
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        inputPosition={inputPosition}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputSection: {
    marginBottom: 32,
    minHeight: 100, // Reserve space for error message to prevent layout shifts
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 8,
    minHeight: 68,
    // Enhanced shadow for both iOS and Android
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 10 
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10, // Android shadow
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    marginRight: 12,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
    backgroundColor: 'transparent',
    letterSpacing: 0.8,
    paddingVertical: 0,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginBottom: 8,
    marginLeft: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  helperText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 18,
    marginLeft: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default PhoneInput;
