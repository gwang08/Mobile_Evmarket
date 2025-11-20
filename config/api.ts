import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Read from .env file via expo-constants
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://evmarket-api-staging-backup.onrender.com/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Tăng lên 60 giây để đủ thời gian cho backend wake up từ sleep
  headers: {
    'Content-Type': 'application/json',
    'x-client-type': 'mobile', // Thêm header để backend biết đây là mobile request
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Log API calls để debug
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    console.error(`❌ API Error: ${method} ${url} - Status: ${status}`);
    console.error('Error details:', error.response?.data);
    
    if (status === 401) {
      // Token expired or invalid
      console.error('❌ 401 Unauthorized - Token may be invalid or expired');
      try {
        const token = await AsyncStorage.getItem('accessToken');
        console.log('Current token exists:', !!token);
        if (token) {
          console.log('Token preview:', token.substring(0, 20) + '...');
        }
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
        // Token expired, user will be logged out automatically by AuthContext
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;