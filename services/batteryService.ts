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