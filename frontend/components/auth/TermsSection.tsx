import React from 'react';
import { View, Text, StyleSheet, Platform} from 'react-native';
import { Colors } from '@/constants/colors';

interface TermsSectionProps {
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

const TermsSection: React.FC<TermsSectionProps> = ({ 
  onTermsPress = () => {},
  onPrivacyPress = () => {}
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <View style={styles.contentContainer}>
        <Text style={styles.termsText}>
          By continuing, you acknowledge that you have read and agree to our{' '}
          <Text style={styles.termsLink} onPress={onTermsPress}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.termsLink} onPress={onPrivacyPress}>
            Privacy Policy
          </Text>
        </Text>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 70,
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: -24,
    marginBottom: 20,
    opacity: 0.3,
  },
  contentContainer: {
    alignItems: 'center',
    gap: 16,
  },
  termsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.2,
    maxWidth: 320,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  termsLink: {
    color: Colors.textPrimary,
    fontWeight: '900',
    textDecorationLine: 'none',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default TermsSection;
