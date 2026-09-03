import { apiClient } from './client';
import { ServiceRequest, ServiceResponse } from '../types/service';

export async function getMyServices(): Promise<ServiceResponse[]> {
  const { data } = await apiClient.get<ServiceResponse[]>('/api/admin/services');
  return data;
}

export async function createService(payload: ServiceRequest): Promise<ServiceResponse> {
  const { data } = await apiClient.post<ServiceResponse>('/api/admin/services', payload);
  return data;
}

export async function updateService(id: number, payload: ServiceRequest): Promise<ServiceResponse> {
  const { data } = await apiClient.put<ServiceResponse>(`/api/admin/services/${id}`, payload);
  return data;
}

export async function toggleServiceActive(id: number): Promise<void> {
  await apiClient.patch(`/api/admin/services/${id}/toggle`);
}