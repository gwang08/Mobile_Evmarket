import apiClient from '../config/api';
import { ChatbotRequest, ChatbotResponse } from '../types';

export const chatbotService = {
  async askChatbot(question: string): Promise<ChatbotResponse> {
    const chatbotData: ChatbotRequest = { question };
    const response = await apiClient.post<ChatbotResponse>('/chatbot/', chatbotData);
    return response.data;
  },
};
