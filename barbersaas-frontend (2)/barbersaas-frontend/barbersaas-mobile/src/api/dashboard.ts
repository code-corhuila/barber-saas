import { apiClient } from './client';
import { BarbershopDashboardResponse } from '../types/dashboard';

export async function getBarbershopDashboard(from: string, to: string): Promise<BarbershopDashboardResponse> {
  const { data } = await apiClient.get<BarbershopDashboardResponse>('/api/admin/dashboard', {
    params: { from, to },
  });
  return data;
}