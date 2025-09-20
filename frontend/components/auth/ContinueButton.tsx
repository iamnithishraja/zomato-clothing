import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

interface ContinueButtonProps {
  isValid: boolean;
  isLoading: boolean;
  onPress: () => void;
  fadeAnim?: Animated.Value;
}

const ContinueButton: React.FC<ContinueButtonProps> = ({ 
  isValid, 
  isLoading, 
  onPress, 
  fadeAnim 
}) => {
  const buttonContent = (
    <TouchableOpacity
      style={[
        styles.continueButton,
        (!isValid || isLoading) && styles.continueButtonDisabled
      ]}
      onPress={onPress}
      disabled={!isValid || isLoading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={Colors.gradients.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buttonGradient}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? "Sending OTP..." : "Continue"}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (fadeAnim) {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {buttonContent}
      </Animated.View>
    );
  }

  return buttonContent;
};

const styles = StyleSheet.create({
  continueButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 6,
    shadowColor: Colors.buttonPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  continueButtonDisabled: {
    opacity: 0.7,
    shadowColor: Colors.shadow,
  },
  buttonGradient: {
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default ContinueButton;
