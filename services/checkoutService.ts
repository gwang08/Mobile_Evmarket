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
};
