import { apiClient } from './client';
import { FavoriteResponse } from '../types/favorite';

export async function getMyFavorites(): Promise<FavoriteResponse[]> {
  const { data } = await apiClient.get<FavoriteResponse[]>('/api/client/favorites');
  return data;
}

export async function addFavorite(barbershopId: number): Promise<void> {
  await apiClient.post(`/api/client/favorites/${barbershopId}`);
}

export async function removeFavorite(barbershopId: number): Promise<void> {
  await apiClient.delete(`/api/client/favorites/${barbershopId}`);
}
