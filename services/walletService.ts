import apiClient from '../config/api';
import { WalletResponse, DepositRequest, DepositResponse } from '../types';

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
};