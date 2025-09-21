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
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface EmailAuthProps {
  onBack: () => void;
}

const EmailAuth: React.FC<EmailAuthProps> = ({ onBack }) => {
  const router = useRouter();
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Memoized validation
  const isValidName = useMemo(() => {
    if (isLogin) return true; // Name not required for login
    return name && name.trim().length >= 2;
  }, [name, isLogin]);

  const isValidEmail = useMemo(() => {
    if (!email || email.length === 0) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320; // RFC 5321 limit
  }, [email]);

  const isValidPhone = useMemo(() => {
    if (isLogin) return true; // Phone not required for login
    if (!phone || phone.length === 0) return true; // Phone is optional for registration
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
  }, [phone, isLogin]);

  const isValidPassword = useMemo(() => {
    if (!password || password.length === 0) return false;
    if (password.length < 6) return false; // Minimum 6 characters
    if (password.length > 128) return false;
    return true; // Simple validation for both login and registration
  }, [password]);

  const isFormValid = useMemo(() => {
    if (isLogin) {
      if (loginMethod === 'email') {
        return isValidEmail && isValidPassword;
      } else if (loginMethod === 'phone') {
        return isValidPhone && isValidPassword;
      }
      return false;
    } else {
      // For registration: name + password + (email OR phone)
      const hasEmailOrPhone = (email && isValidEmail) || (phone && isValidPhone);
      return isValidName && isValidPassword && hasEmailOrPhone;
    }
  }, [isValidName, isValidEmail, isValidPassword, isValidPhone, isLogin, loginMethod, email, phone]);

  const handleNameChange = useCallback((text: string) => {
    setName(text.trim());
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    // Only convert to lowercase, let backend handle trimming
    setEmail(text.toLowerCase());
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    // Clean phone number - remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    setPhone(cleaned);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    // Don't modify password input, let user type what they want
    setPassword(text);
  }, []);


  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [showPassword]);

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

      const endpoint = isLogin ? '/api/v1/user/login' : '/api/v1/user/register';
      
      console.log('Sending request to:', endpoint);
      console.log('Request data:', { email, password: '***' });
      
      const requestData = isLogin 
        ? (loginMethod === 'email' 
            ? { email, password }
            : { phone: phone.replace(/\D/g, ''), password }) // Send clean 10-digit number for phone login
        : { 
            name, 
            password,
            ...(email && { email }),
            ...(phone && phone.trim() && { phone: phone.replace(/\D/g, '') }) // Send clean 10-digit number
          };
      
      const response = await apiClient.post(endpoint, requestData);

      if (response.data.success) {
        // Store token and user data using AuthContext
        const { token, user } = response.data;
        
        // Login through AuthContext
        await login(user, token);
        
        // Auto navigate to home screen
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', response.data.message || 'Authentication failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      const errorMessage = error.response?.data?.message || 'Authentication failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, isLoading, fadeAnim, name, email, phone, password, isLogin, loginMethod, login, router]);

  const toggleMode = useCallback(() => {
    setIsLogin(!isLogin);
    setLoginMethod('email'); // Reset to email login by default
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setShowPassword(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isLogin]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header with back button and logo */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Locals</Text>
            <View style={styles.logoUnderline} />
          </View>
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Enter your details to create a new account. You need either email or phone number.'
              }
            </Text>

            {/* Form Content */}
            <View style={styles.formContent}>
              {/* Login Method Toggle - Only show for login */}
              {isLogin && (
                <View style={styles.loginMethodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.loginMethodButton,
                      loginMethod === 'email' && styles.loginMethodButtonActive
                    ]}
                    onPress={() => {
                      setLoginMethod('email');
                      setPhone('');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[
                      styles.loginMethodText,
                      loginMethod === 'email' && styles.loginMethodTextActive
                    ]}>
                      Email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.loginMethodButton,
                      loginMethod === 'phone' && styles.loginMethodButtonActive
                    ]}
                    onPress={() => {
                      setLoginMethod('phone');
                      setEmail('');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[
                      styles.loginMethodText,
                      loginMethod === 'phone' && styles.loginMethodTextActive
                    ]}>
                      Phone
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Name Input - Only show for registration */}
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name</Text>
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
              )}


              {/* Email Input - Show for email login or registration */}
              {(!isLogin || loginMethod === 'email') && (
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address {!isLogin ? '' : ''}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={email ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder={isLogin ? "Enter your email" : "Enter your email "}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                </View>
                {email && !isValidEmail && (
                  <Text style={styles.errorText}>
                    Please enter a valid email address
                  </Text>
                )}
                </View>
              )}

              {/* Phone Input - Show for phone login or registration */}
              {(!isLogin || loginMethod === 'phone') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Number {!isLogin ? '(Optional)' : ''}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="call-outline" 
                      size={20} 
                      color={phone ? Colors.buttonPrimary : Colors.textMuted} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      placeholder={isLogin ? "Enter your phone number" : "Enter your phone number (optional)"}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>
                  {phone && !isValidPhone && (
                    <Text style={styles.errorText}>
                      Please enter a valid 10-digit phone number
                    </Text>
                  )}
                </View>
              )}

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={password ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                  />
                  <Pressable onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={Colors.textMuted} 
                    />
                  </Pressable>
                </View>
                {password && !isValidPassword && (
                  <Text style={styles.errorText}>
                    Password must be at least 6 characters long
                  </Text>
                )}
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
                    <Text style={[
                      styles.submitButtonText,
                      !isFormValid && styles.submitButtonTextDisabled
                    ]}>
                      {isLoading 
                        ? (isLogin ? "Signing In..." : "Creating Account...") 
                        : (isLogin ? "Sign In" : "Create Account")
                      }
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Toggle Mode */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <Pressable onPress={toggleMode}>
                  <Text style={styles.toggleLink}>
                    {isLogin ? "Sign Up" : "Sign In"}
                  </Text>
                </Pressable>
              </View>

              {/* Security Info */}
              <View style={styles.securityInfo}>
                <View style={styles.securityIconContainer}>
                  <View style={styles.securityIcon} />
                </View>
                <Text style={styles.securityText}>
                  Your data is secure and encrypted
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formContent: {
    paddingTop: 20,
  },
  loginMethodContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  loginMethodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginMethodButtonActive: {
    backgroundColor: Colors.buttonPrimary,
  },
  loginMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  loginMethodTextActive: {
    color: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  logoUnderline: {
    width: 50,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: 4,
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
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 24,
    elevation: 6,
    shadowColor: Colors.buttonPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  toggleLink: {
    fontSize: 16,
    color: Colors.buttonPrimary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  securityIconContainer: {
    marginRight: 8,
  },
  securityIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.buttonPrimary,
    borderWidth: 2,
    borderColor: Colors.buttonPrimary,
  },
  securityText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default EmailAuth;
