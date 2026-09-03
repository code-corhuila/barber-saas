import { apiClient } from './client';
import { BarberStatsResponse } from '../types/barberStats';

export async function getMyBarberStats(): Promise<BarberStatsResponse> {
  const { data } = await apiClient.get<BarberStatsResponse>('/api/barber/stats');
  return data;
}