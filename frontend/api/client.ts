import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variable or fallback to localhost for development
export const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

const apiClient = axios.create({
    baseURL: baseUrl,
    timeout: 10000, // 10 second timeout
});

apiClient.interceptors.request.use(async (config) => {
    // Add ngrok bypass header only if using ngrok
    if (baseUrl?.includes('ngrok')) {
        config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    // Add JWT token to requests if available
    try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        // Silent error handling to avoid console spam
    }
    
    return config;
});

export default apiClient;