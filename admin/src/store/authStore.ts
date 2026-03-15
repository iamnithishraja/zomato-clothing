import { create } from 'zustand';
import api from '../services/api';

interface Admin {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  signup: (data: { username: string; email: string; password: string; phone?: string }) => Promise<void>;
  loginWithPassword: (data: { username: string; password: string }) => Promise<void>;
  requestOTP: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  signup: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/api/v1/admin/auth/signup', data);
      const { admin, token } = response.data.data;
      
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      
      set({ admin, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  },

  loginWithPassword: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/api/v1/admin/auth/login-password', data);
      const { admin, token } = response.data.data;
      
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      
      set({ admin, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  requestOTP: async (phone) => {
    set({ isLoading: true });
    try {
      await api.post('/api/v1/admin/auth/request-otp', { phone });
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  },

  verifyOTP: async (phone, otp) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/api/v1/admin/auth/verify-otp', { phone, otp });
      const { admin, token } = response.data.data;
      
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      
      set({ admin, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    set({ admin: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    
    if (token && adminUser) {
      try {
        const admin = JSON.parse(adminUser);
        set({ admin, token, isAuthenticated: true });
      } catch (error) {
        // Invalid data in storage, clear it
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
  },
}));
