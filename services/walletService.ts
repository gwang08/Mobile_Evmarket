import apiClient from '../config/api';
import { WalletResponse, DepositRequest, DepositResponse, WalletHistoryResponse } from '../types';

export const walletService = {
  async getWalletBalance(): Promise<WalletResponse> {
    const response = await apiClient.get<WalletResponse>('/wallet/');
    return response.data;
  },

  async depositToWallet(amount: number): Promise<DepositResponse> {
    const depositData: DepositRequest = { amount };
    const response = await apiClient.post<DepositResponse>('/wallet/deposit', depositData);
    return response.data;
  },

  async getWalletHistory(page: number = 1, limit: number = 10): Promise<WalletHistoryResponse> {
    const response = await apiClient.get<WalletHistoryResponse>('/wallet/history', {
      params: { page, limit }
    });
    return response.data;
  },
};