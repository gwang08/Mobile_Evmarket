import apiClient from '../config/api';
import { CheckoutRequest, CheckoutResponse, Transaction } from '../types';

export const checkoutService = {
  async initiateCheckout(checkoutData: CheckoutRequest): Promise<CheckoutResponse> {
    const response = await apiClient.post<CheckoutResponse>('/checkout', checkoutData);
    return response.data;
  },

  async payWithWallet(transactionId: string): Promise<{ message: string; data: Transaction }> {
    const response = await apiClient.post<{ message: string; data: Transaction }>(
      `/checkout/${transactionId}/pay-with-wallet`
    );
    return response.data;
  },

  async rejectTransaction(transactionId: string): Promise<{ message: string; data: Transaction }> {
    const response = await apiClient.post<{ message: string; data: Transaction }>(
      `/transactions/${transactionId}/reject`
    );
    return response.data;
  },

  async payAuctionTransaction(transactionId: string, paymentMethod: 'WALLET' | 'MOMO'): Promise<{ message: string; data: any }> {
    const response = await apiClient.post<{ message: string; data: any }>(
      `/transactions/${transactionId}/pay`,
      { paymentMethod }
    );
    return response.data;
  },
};
