import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variable or fallback to localhost for development
export const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

// Log the base URL for debugging
console.log('API Base URL:', baseUrl);

const apiClient = axios.create({
    baseURL: baseUrl,
    timeout: 10000, // 10 second timeout
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});

apiClient.interceptors.request.use(async (config) => {
    // Log outgoing requests
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    
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
        console.log('Error adding token to request:', error);
    }
    
    return config;
});

export default apiClient;