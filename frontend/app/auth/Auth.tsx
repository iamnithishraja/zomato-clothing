import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Alert,
  Dimensions,
  ImageBackground
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import PhoneInput from "@/components/auth/PhoneInput";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import ContinueButton from "@/components/auth/ContinueButton";
import TermsSection from "@/components/auth/TermsSection";

const { height } = Dimensions.get('window');

const Auth = () => {
  const router = useRouter();
  // const { login } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Memoized phone number validation
  const isValidPhone = useMemo(() => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return cleanNumber.length === 10;
  }, [phoneNumber]);

  const handlePhoneChange = useCallback((text: string) => {
    setPhoneNumber(text);
  }, []);

  const handleGetOtp = useCallback(async () => {
    if (isSendingOtp || !isValidPhone) return;

    try {
      setIsSendingOtp(true);

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

      // Generate final phone number
      const finalPhoneNumber = phoneNumber.replace(/\s/g, '') || `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;

      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to OTP screen with phone number
      router.push({
        pathname: '/auth/OtpScreen',
        params: { phoneNumber: finalPhoneNumber }
      });
    } catch {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  }, [isSendingOtp, isValidPhone, fadeAnim, phoneNumber, router]);

  // const openLink = useCallback(async (url: string) => {
  //   try {
  //     await Linking.openURL(url);
  //   } catch {
  //     console.log('Error opening link');
  //   }
  // }, []);

  return (
    <View style={styles.container}>
      {/* Background Image - Top 50% only - Creates visual appeal and branding */}
      <ImageBackground
        source={require('../../assets/images/locals2.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* StatusBar - Controls the appearance of the status bar at the top of the screen */}
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* KeyboardAvoidingView - Automatically adjusts the view when keyboard appears to prevent input fields from being hidden */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.content}>
          {/* Top Section - Reserved space for brand header/logo area */}
          <View style={styles.topSection}>
            <View style={styles.brandContainer}>
              {/* Brand content can be added here if needed */}
            </View>
          </View>

          {/* Modal Container - Fixed at bottom */}
          <View style={styles.modalContainer}>
            {/* Fixed Header Section */}
            <View style={styles.modalHeader}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>Locals</Text>
                <View style={styles.logoUnderline} />
              </View>
              <Text style={styles.modalSubtitle}>
                Enter your mobile number to discover premium fashion at your doorstep
              </Text>
            </View>

            {/* Scrollable Content Section */}
            <View style={styles.scrollableContent}>
              {/* Phone Input Section */}
              <PhoneInput
                phoneNumber={phoneNumber}
                onPhoneChange={handlePhoneChange}
                isValid={isValidPhone}
              />

              {/* Continue Button */}
              <ContinueButton
                isValid={isValidPhone}
                isLoading={isSendingOtp}
                onPress={handleGetOtp}
                fadeAnim={fadeAnim}
              />

              {/* Social Login Buttons */}
              <SocialLoginButtons />

              {/* Bottom Terms */}
              <TermsSection />
            </View>
          </View>
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: height * 0.4, // Reduced to 40% for better keyboard behavior
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
  topSection: {
    height: height * 0.25, // Reduced height for better keyboard behavior
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  brandContainer: {
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  logoUnderline: {
    width: 60,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: 4,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default Auth;