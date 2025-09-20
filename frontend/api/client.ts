import axios from "axios";

// Use environment variable or fallback to localhost for development
export const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
console.log("🔗 Backend URL:", baseUrl);

const apiClient = axios.create({
    baseURL: baseUrl,
    timeout: 10000, // 10 second timeout
});

apiClient.interceptors.request.use(async (config) => {
    // Add ngrok bypass header only if using ngrok
    if (baseUrl?.includes('ngrok')) {
        config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    return config;
});

export default apiClient;