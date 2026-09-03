import { apiClient } from './client';
import { PromotionRequest, PromotionResponse } from '../types/promotion';

export async function getPublicPromotions(barbershopId: number): Promise<PromotionResponse[]> {
  const { data } = await apiClient.get<PromotionResponse[]>(`/api/public/barbershops/${barbershopId}/promotions`);
  return data;
}

export async function getMyPromotions(): Promise<PromotionResponse[]> {
  const { data } = await apiClient.get<PromotionResponse[]>('/api/admin/promotions');
  return data;
}

export async function createPromotion(payload: PromotionRequest): Promise<PromotionResponse> {
  const { data } = await apiClient.post<PromotionResponse>('/api/admin/promotions', payload);
  return data;
}

export async function updatePromotion(id: number, payload: PromotionRequest): Promise<PromotionResponse> {
  const { data } = await apiClient.put<PromotionResponse>(`/api/admin/promotions/${id}`, payload);
  return data;
}

export async function togglePromotionActive(id: number): Promise<void> {
  await apiClient.patch(`/api/admin/promotions/${id}/toggle`);
}

export async function deletePromotion(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/promotions/${id}`);
}
