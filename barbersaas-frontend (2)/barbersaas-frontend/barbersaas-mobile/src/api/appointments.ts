import { apiClient } from './client';
import { AppointmentResponse, CreateAppointmentRequest, CancelAppointmentRequest } from '../types/appointment';
import { AuthResponse, SelfRegisterBarbershopRequest } from '../types/auth';

export async function createAppointment(payload: CreateAppointmentRequest): Promise<AppointmentResponse> {
  const { data } = await apiClient.post<AppointmentResponse>('/api/client/appointments', payload);
  return data;
}

export async function getMyAppointments(): Promise<AppointmentResponse[]> {
  const { data } = await apiClient.get<AppointmentResponse[]>('/api/client/appointments');
  return data;
}

export async function cancelAppointment(id: number, payload: CancelAppointmentRequest): Promise<AppointmentResponse> {
  const { data } = await apiClient.patch<AppointmentResponse>(`/api/client/appointments/${id}/cancel`, payload);
  return data;
}

export async function getBarbershopAgenda(date: string): Promise<import('../types/appointment').AppointmentResponse[]> {
  const { data } = await apiClient.get('/api/admin/appointments', { params: { date } });
  return data;
}

export async function confirmAppointment(id: number) {
  const { data } = await apiClient.patch(`/api/appointments/${id}/confirm`);
  return data;
}

export async function getMyBarberAgenda(date: string): Promise<import('../types/appointment').AppointmentResponse[]> {
  const { data } = await apiClient.get('/api/barber/appointments', { params: { date } });
  return data;
}

export async function startAppointment(id: number) {
  const { data } = await apiClient.patch(`/api/appointments/${id}/start`);
  return data;
}

export async function completeAppointment(id: number) {
  const { data } = await apiClient.patch(`/api/appointments/${id}/complete`);
  return data;
}

export async function markNoShow(id: number) {
  const { data } = await apiClient.patch(`/api/appointments/${id}/no-show`);
  return data;
}

export async function registerBarbershopOwner(payload: SelfRegisterBarbershopRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register-barbershop', payload);
  return data;
}