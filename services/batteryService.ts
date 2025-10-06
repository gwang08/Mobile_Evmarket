import apiClient from '../config/api';
import { BatteriesResponse, BatteryDetailResponse } from '../types';

export const batteryService = {
  getAllBatteries: async (): Promise<BatteriesResponse> => {
    try {
      const response = await apiClient.get<BatteriesResponse>('/batteries/');
      return response.data;
    } catch (error) {
      console.error('Error fetching batteries:', error);
      throw error;
    }
  },

  getBatteryById: async (id: string): Promise<BatteryDetailResponse> => {
    try {
      const response = await apiClient.get<BatteryDetailResponse>(`/batteries/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching battery by id:', error);
      throw error;
    }
  },
};