import { apiClient } from './client';
import { BarberScheduleRequest, BarberScheduleResponse } from '../types/schedule';

export async function getBarberSchedule(barberProfileId: number): Promise<BarberScheduleResponse[]> {
  const { data } = await apiClient.get<BarberScheduleResponse[]>(`/api/admin/barbers/${barberProfileId}/schedule`);
  return data;
}

export async function setBarberSchedule(barberProfileId: number, payload: BarberScheduleRequest): Promise<BarberScheduleResponse[]> {
  const { data } = await apiClient.put<BarberScheduleResponse[]>(`/api/admin/barbers/${barberProfileId}/schedule`, payload);
  return data;
}