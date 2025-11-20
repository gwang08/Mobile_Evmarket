import apiClient from '../config/api';
import { 
  AppointmentListResponse, 
  ProposeDateRequest, 
  ConfirmAppointmentRequest,
  Appointment 
} from '../types';

export const appointmentService = {
  async getMyAppointments(page: number = 1, limit: number = 10): Promise<AppointmentListResponse> {
    const response = await apiClient.get<AppointmentListResponse>('/appointments/me', {
      params: { page, limit }
    });
    return response.data;
  },

  async proposeDate(appointmentId: string, proposedDates: string[]): Promise<{ message: string; data: Appointment }> {
    const requestData: ProposeDateRequest = { proposedDates };
    const response = await apiClient.post<{ message: string; data: Appointment }>(
      `/appointments/${appointmentId}/propose-date`,
      requestData
    );
    return response.data;
  },

  async confirmAppointment(appointmentId: string, confirmedDate: string): Promise<{ message: string; data: Appointment }> {
    const requestData: ConfirmAppointmentRequest = { confirmedDate };
    const response = await apiClient.post<{ message: string; data: Appointment }>(
      `/appointments/${appointmentId}/confirm`,
      requestData
    );
    return response.data;
  },
};
