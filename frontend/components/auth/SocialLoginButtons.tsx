import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface SocialLoginButtonsProps {
  onGoogleLogin?: () => void;
  onEmailLogin?: () => void;
  onAppleLogin?: () => void;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ 
  onGoogleLogin = () => console.log('Google login'), 
  onEmailLogin = () => console.log('Email login'),
  onAppleLogin = () => console.log('Apple login')
}) => {
  return (
    <View style={styles.socialSection}>
      <Text style={styles.orText}>Or continue with</Text>
      
      <View style={styles.socialButtons}>
        <TouchableOpacity style={styles.socialButton} onPress={onGoogleLogin}>
          <View style={styles.iconContainer}>
            <View>
              <AntDesign name="google" size={24} color="#4285F4" />
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.socialButton} onPress={onAppleLogin}>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-apple" size={24} color="#000000" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.socialButton} onPress={onEmailLogin}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="email" size={24} color="#EA4335" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  socialSection: {
    marginBottom: 2,
  },
  orText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 1,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SocialLoginButtons;
