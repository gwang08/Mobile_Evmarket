import apiClient from '../config/api';
import { ChatbotRequest, ChatbotResponse } from '../types';

export const chatbotService = {
  async askChatbot(question: string): Promise<ChatbotResponse> {
    const chatbotData: ChatbotRequest = { question };
    // Chatbot có thể mất nhiều thời gian để trả lời (AI processing)
    // Tăng timeout lên 60 giây riêng cho chatbot
    const response = await apiClient.post<ChatbotResponse>('/chatbot/', chatbotData, {
      timeout: 60000, // 60 seconds
    });
    return response.data;
  },
};
