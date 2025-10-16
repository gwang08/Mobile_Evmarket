import apiClient from '../config/api';
import { BatteriesResponse, BatteryDetailResponse, Battery } from '../types';

export interface CreateBatteryRequest {
  title: string;
  description: string;
  price: number;
  images: string[];
  brand: string;
  capacity: number;
  year: number;
  health: number;
  specifications: {
    weight: string;
    voltage: string;
    chemistry: string;
    degradation: string;
    chargingTime: string;
    installation: string;
    warrantyPeriod: string;
    temperatureRange: string;
  };
}

export interface UpdateBatteryRequest extends Partial<CreateBatteryRequest> {}

export const batteryService = {
  getAllBatteries: async (page: number = 1, limit: number = 10): Promise<BatteriesResponse> => {
    try {
      const response = await apiClient.get<BatteriesResponse>(`/batteries/?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batteries:', error);
      throw error;
    }
  },

  // Fetch available batteries until we get the desired count
  getAvailableBatteries: async (desiredCount: number = 6): Promise<Battery[]> => {
    const availableBatteries: Battery[] = [];
    let currentPage = 1;
    const limit = 10;
    
    try {
      while (availableBatteries.length < desiredCount) {
        const response = await apiClient.get<BatteriesResponse>(`/batteries/?page=${currentPage}&limit=${limit}`);
        const pageBatteries = response.data.data.batteries.filter(b => b.status === 'AVAILABLE');
        
        availableBatteries.push(...pageBatteries);
        
        // Check if we've reached the last page
        if (currentPage >= (response.data.data.totalPages || 1)) {
          break;
        }
        
        currentPage++;
      }
      
      // Return only the desired count
      return availableBatteries.slice(0, desiredCount);
    } catch (error) {
      console.error('Error fetching available batteries:', error);
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

  createBattery: async (batteryData: CreateBatteryRequest): Promise<{ message: string; data: { battery: Battery } }> => {
    try {
      const response = await apiClient.post('/batteries/', batteryData);
      return response.data;
    } catch (error) {
      console.error('Error creating battery:', error);
      throw error;
    }
  },

  updateBattery: async (id: string, batteryData: UpdateBatteryRequest): Promise<{ message: string; data: { battery: Battery } }> => {
    try {
      const response = await apiClient.patch(`/batteries/${id}`, batteryData);
      return response.data;
    } catch (error) {
      console.error('Error updating battery:', error);
      throw error;
    }
  },

  deleteBattery: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete(`/batteries/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting battery:', error);
      throw error;
    }
  },

  getMyBatteries: async (userId: string): Promise<BatteriesResponse> => {
    try {
      // Get all batteries and filter by sellerId
      const response = await apiClient.get<BatteriesResponse>('/batteries/');
      const allBatteries = response.data;
      
      // Filter batteries by sellerId
      const myBatteries = allBatteries.data.batteries.filter(battery => battery.sellerId === userId);
      
      return {
        message: allBatteries.message,
        data: {
          batteries: myBatteries
        }
      };
    } catch (error) {
      console.error('Error fetching my batteries:', error);
      throw error;
    }
  },
};