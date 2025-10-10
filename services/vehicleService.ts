import apiClient from '../config/api';
import { VehiclesResponse, VehicleDetailResponse, Vehicle } from '../types';

export interface CreateVehicleRequest {
  title: string;
  description: string;
  price: number;
  images: string[];
  brand: string;
  model: string;
  year: number;
  mileage: number;
  specifications: {
    warranty: {
      basic: string;
      battery: string;
      drivetrain: string;
    };
    dimensions: {
      width: string;
      height: string;
      length: string;
      curbWeight: string;
    };
    performance: {
      topSpeed: string;
      motorType: string;
      horsepower: string;
      acceleration: string;
    };
    batteryAndCharging: {
      range: string;
      chargeTime: string;
      chargingSpeed: string;
      batteryCapacity: string;
    };
  };
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {}

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

  createVehicle: async (vehicleData: CreateVehicleRequest): Promise<{ message: string; data: { vehicle: Vehicle } }> => {
    try {
      const response = await apiClient.post('/vehicles/', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  updateVehicle: async (id: string, vehicleData: UpdateVehicleRequest): Promise<{ message: string; data: { vehicle: Vehicle } }> => {
    try {
      const response = await apiClient.patch(`/vehicles/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  deleteVehicle: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },

  getMyVehicles: async (userId: string): Promise<VehiclesResponse> => {
    try {
      // Get all vehicles and filter by sellerId
      const response = await apiClient.get<VehiclesResponse>('/vehicles/');
      const allVehicles = response.data;
      
      // Filter vehicles by sellerId
      const myVehicles = allVehicles.data.vehicles.filter(vehicle => vehicle.sellerId === userId);
      
      return {
        message: allVehicles.message,
        data: {
          vehicles: myVehicles
        }
      };
    } catch (error) {
      console.error('Error fetching my vehicles:', error);
      throw error;
    }
  },
};