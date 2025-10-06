import apiClient from '../config/api';
import { VehiclesResponse, VehicleDetailResponse } from '../types';

export const vehicleService = {
  getAllVehicles: async (): Promise<VehiclesResponse> => {
    try {
      const response = await apiClient.get<VehiclesResponse>('/vehicles/');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  getVehicleById: async (id: string): Promise<VehicleDetailResponse> => {
    try {
      const response = await apiClient.get<VehicleDetailResponse>(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle by id:', error);
      throw error;
    }
  },
};