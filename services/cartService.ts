import apiClient from '../config/api';

export interface AddToCartRequest {
  batteryId?: string;
  vehicleId?: string;
}

export interface CartItem {
  id: string;
  listingId: string;
  listingType: 'VEHICLE' | 'BATTERY';
  price: number;
  createdAt: string;
  updatedAt: string;
  battery?: {
    id: string;
    title: string;
    images: string[];
    price: number;
    brand: string;
    capacity: number;
    year: number;
    health: number | null;
    seller?: {
      id: string;
      name: string;
      avatar: string;
    };
  };
  vehicle?: {
    id: string;
    title: string;
    images: string[];
    price: number;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    seller?: {
      id: string;
      name: string;
      avatar: string;
    };
  };
}

export interface CartResponse {
  message: string;
  data: {
    items: CartItem[];
    totalPrice: number;
    totalItems: number;
  };
}

export const cartService = {
  async addToCart(item: AddToCartRequest): Promise<CartResponse> {
    // API expects batteryId or vehicleId directly, not listingId + listingType
    const response = await apiClient.post<CartResponse>('/cart/items', item);
    return response.data;
  },

  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get<CartResponse>('/cart');
    return response.data;
  },

  async removeFromCart(itemId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/cart/items/${itemId}`);
    return response.data;
  },

  async clearCart(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/cart');
    return response.data;
  },
};

