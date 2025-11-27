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
      // Skip adding token for refresh token endpoint if it's a refresh attempt
      if (config.url?.includes('/auth/refresh-token') && (config as any).skipAuthRefresh) {
        console.log(`🌐 API Request (no auth): ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
      }
      
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

// Response interceptor to handle auth errors and auto refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    console.error(`❌ API Error: ${method} ${url} - Status: ${status}`);
    console.error('Error details:', error.response?.data);
    
    if (status === 401 && !originalRequest._retry) {
      // Skip refresh token for auth endpoints
      if (url?.includes('/auth/login') || url?.includes('/auth/register') || url?.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('No token available');
        }

        console.log('🔄 Attempting to refresh token...');
        
        // Call refresh token API - try with token first, then without if needed
        // Create a new axios instance to avoid interceptor loop
        const refreshAxios = axios.create({
          baseURL: API_BASE_URL,
          timeout: 30000,
        });
        
        let refreshResponse;
        try {
          // Try with token in header first (most common case)
          refreshAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          refreshResponse = await refreshAxios.post<{ message: string; data: { accessToken: string } }>(
            '/auth/refresh-token',
            {}
          );
        } catch (refreshError: any) {
          // If fails with 401, try without token (some APIs don't need token for refresh)
          if (refreshError.response?.status === 401) {
            console.log('🔄 Retrying refresh without token...');
            delete refreshAxios.defaults.headers.common['Authorization'];
            refreshResponse = await refreshAxios.post<{ message: string; data: { accessToken: string } }>(
              '/auth/refresh-token',
              {}
            );
          } else {
            throw refreshError;
          }
        }

        const newToken = refreshResponse.data.data.accessToken;
        await AsyncStorage.setItem('accessToken', newToken);
        
        console.log('✅ Token refreshed successfully');
        
        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process queued requests
        processQueue(null, newToken);
        isRefreshing = false;
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Refresh failed, clear auth data and logout
        processQueue(refreshError, null);
        isRefreshing = false;
        
        try {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('user');
          console.log('🧹 Cleared auth data after refresh failure');
        } catch (e) {
          console.error('Error clearing auth data:', e);
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;