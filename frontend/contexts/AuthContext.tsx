import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

interface User {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  avatar?: string;
  addresses?: string[];
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  role: 'User' | 'Merchant' | 'Delivery';
  isBusy?: boolean; // For delivery partners
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  updateUser: (userData: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        try {
          // Validate token with backend and get latest user data
          const validationResult = await validateToken(storedToken);
          
          if (validationResult.isValid && validationResult.userData) {
            console.log('🔄 Token validation successful, updating user data:', {
              storedUser: JSON.parse(storedUser),
              latestUser: validationResult.userData,
              isProfileCompleteChanged: JSON.parse(storedUser).isProfileComplete !== validationResult.userData.isProfileComplete
            });
            setToken(storedToken);
            // Use the latest user data from backend instead of stored data
            setUser(validationResult.userData);
            // Update stored user data with latest information
            await AsyncStorage.setItem('userData', JSON.stringify(validationResult.userData));
          } else {
            console.log('❌ Token validation failed, clearing auth data');
            // Token is invalid, clear storage
            await clearAuthData();
          }
        } catch (validationError) {
          // If validation fails due to network issues, still allow login
          // This provides better UX when backend is temporarily unavailable
          console.log('⚠️ Token validation failed due to network error, using stored data:', validationError);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const validateToken = async (tokenToValidate: string): Promise<{ isValid: boolean; userData?: User }> => {
    try {
      // Make a test request to validate the token and get latest user data
      const response = await apiClient.get('/api/v1/user/profile', {
        headers: {
          Authorization: `Bearer ${tokenToValidate}`
        }
      });
      
      if (response.status === 200 && response.data.success) {
        return {
          isValid: true,
          userData: response.data.user
        };
      }
      return { isValid: false };
    } catch (error) {
      console.log('Token validation error:', error);
      return { isValid: false };
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const login = async (userData: User, authToken: string) => {
    try {
      setUser(userData);
      setToken(authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('authToken', authToken);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearAuthData();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const updateUser = async (userData: User) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!(user && token),
    isLoading,
    login,
    logout,
    setLoading,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
