import apiClient from '../config/api';
import { TransactionHistoryResponse } from '../types';

export const transactionService = {
  async getMyTransactions(page: number = 1, limit: number = 10): Promise<TransactionHistoryResponse> {
    const response = await apiClient.get<TransactionHistoryResponse>('/transactions/me', {
      params: { page, limit }
    });
    return response.data;
  },
};
