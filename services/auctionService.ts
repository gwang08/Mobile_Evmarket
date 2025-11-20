import apiClient from '../config/api';
import {
  LiveAuctionsResponse,
  AuctionDetailResponse,
  PlaceBidRequest,
  PlaceBidResponse,
  PayDepositResponse,
  BuyNowResponse,
} from '../types';

export const auctionService = {
  // Get live auctions
  getLiveAuctions: async (page: number = 1, limit: number = 10): Promise<LiveAuctionsResponse> => {
    try {
      const response = await apiClient.get<LiveAuctionsResponse>(`/auctions/live?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live auctions:', error);
      throw error;
    }
  },

  // Get auction detail by type and ID
  getAuctionDetail: async (listingType: 'VEHICLE' | 'BATTERY', listingId: string): Promise<AuctionDetailResponse> => {
    try {
      const response = await apiClient.get<AuctionDetailResponse>(`/auctions/${listingType}/${listingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching auction detail:', error);
      throw error;
    }
  },

  // Place a bid
  placeBid: async (listingType: 'VEHICLE' | 'BATTERY', listingId: string, bidData: PlaceBidRequest): Promise<PlaceBidResponse> => {
    try {
      const response = await apiClient.post<PlaceBidResponse>(`/auctions/${listingType}/${listingId}/bids`, bidData);
      return response.data;
    } catch (error) {
      console.error('Error placing bid:', error);
      throw error;
    }
  },

  // Pay deposit
  payDeposit: async (listingType: 'VEHICLE' | 'BATTERY', listingId: string): Promise<PayDepositResponse> => {
    try {
      const response = await apiClient.post<PayDepositResponse>(`/auctions/${listingType}/${listingId}/deposit`);
      return response.data;
    } catch (error) {
      console.error('Error paying deposit:', error);
      throw error;
    }
  },

  // Buy now
  buyNow: async (listingType: 'VEHICLE' | 'BATTERY', listingId: string): Promise<BuyNowResponse> => {
    try {
      const response = await apiClient.post<BuyNowResponse>(`/auctions/${listingType}/${listingId}/buy-now`);
      return response.data;
    } catch (error) {
      console.error('Error buying now:', error);
      throw error;
    }
  },

  // Create vehicle auction
  createVehicleAuction: async (formData: FormData): Promise<any> => {
    try {
      const response = await apiClient.post('/auctions/vehicles/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle auction:', error);
      throw error;
    }
  },

  // Create battery auction
  createBatteryAuction: async (formData: FormData): Promise<any> => {
    try {
      const response = await apiClient.post('/auctions/batteries/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating battery auction:', error);
      throw error;
    }
  },
};
