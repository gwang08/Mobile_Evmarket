import apiClient from '../config/api';
import { VehiclesResponse, VehicleDetailResponse, Vehicle } from '../types';

export interface CreateVehicleRequest {
  title: string;
  description: string;
  price: number;
  location: string;
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
  getAllVehicles: async (page: number = 1, limit: number = 10): Promise<VehiclesResponse> => {
    try {
      const response = await apiClient.get<VehiclesResponse>(`/vehicles/?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  // Fetch available vehicles until we get the desired count
  getAvailableVehicles: async (desiredCount: number = 6): Promise<Vehicle[]> => {
    const availableVehicles: Vehicle[] = [];
    let currentPage = 1;
    const limit = 10;
    
    try {
      while (availableVehicles.length < desiredCount) {
        const response = await apiClient.get<VehiclesResponse>(`/vehicles/?page=${currentPage}&limit=${limit}`);
        const pageVehicles = response.data.data.vehicles.filter(v => v.status === 'AVAILABLE');
        
        availableVehicles.push(...pageVehicles);
        
        // Check if we've reached the last page
        if (currentPage >= (response.data.data.totalPages || 1)) {
          break;
        }
        
        currentPage++;
      }
      
      // Return only the desired count
      return availableVehicles.slice(0, desiredCount);
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
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
      console.log('Creating vehicle with data:', JSON.stringify(vehicleData, null, 2));
      
      // Backend expects form-data with specifications as JSON string
      const formData = new FormData();
      formData.append('title', vehicleData.title);
      formData.append('description', vehicleData.description);
      formData.append('price', vehicleData.price.toString());
      formData.append('location', vehicleData.location);
      formData.append('brand', vehicleData.brand);
      formData.append('model', vehicleData.model);
      formData.append('year', vehicleData.year.toString());
      formData.append('mileage', vehicleData.mileage.toString());
      formData.append('specifications', JSON.stringify(vehicleData.specifications));
      
      // Add images as files (React Native file upload format)
      vehicleData.images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('images', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
      });
      
      const response = await apiClient.post('/vehicles/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Create vehicle response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
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
      // Sử dụng endpoint /users/me/vehicles để lấy vehicles của user hiện tại
      const response = await apiClient.get<VehiclesResponse>('/users/me/vehicles');
      return response.data;
    } catch (error) {
      console.error('Error fetching my vehicles:', error);
      throw error;
    }
  },
};