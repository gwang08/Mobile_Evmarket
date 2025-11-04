import apiClient from '../config/api';
import { User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface GoogleAuthResponse {
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface ExchangeCodeRequest {
  code: string;
}

export const authService = {
  // Email/Password Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Email/Password Register
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  // Google Login - Get auth URL (not used in mobile, just for reference)
  getGoogleAuthUrl(clientType: 'mobile' | 'web' = 'mobile'): string {
    const baseUrl = apiClient.defaults.baseURL;
    return `${baseUrl}/auth/google?client_type=${clientType}`;
  },

  // Google Login - Exchange code for token
  async exchangeGoogleCode(code: string): Promise<GoogleAuthResponse> {
    const response = await apiClient.post<GoogleAuthResponse>('/auth/exchange-code', { code });
    return response.data;
  },

  // Logout
  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  // Refresh Token
  async refreshToken(): Promise<{ message: string; data: { accessToken: string } }> {
    const response = await apiClient.post<{ message: string; data: { accessToken: string } }>('/auth/refresh-token');
    return response.data;
  },
};
