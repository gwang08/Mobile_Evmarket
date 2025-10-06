import apiClient from '../config/api';
import { SellerDetailResponse } from '../types';

export const userService = {
  getSellerProfile: async (sellerId: string): Promise<SellerDetailResponse> => {
    try {
      const response = await apiClient.get<SellerDetailResponse>(`/users/${sellerId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      throw error;
    }
  },
};