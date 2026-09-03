import { apiClient } from './client';
import { ProductRequest, ProductResponse, StockMovementRequest } from '../types/inventory';

export async function getProducts(): Promise<ProductResponse[]> {
  const { data } = await apiClient.get<ProductResponse[]>('/api/admin/inventory/products');
  return data;
}

export async function createProduct(payload: ProductRequest): Promise<ProductResponse> {
  const { data } = await apiClient.post<ProductResponse>('/api/admin/inventory/products', payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductRequest): Promise<ProductResponse> {
  const { data } = await apiClient.put<ProductResponse>(`/api/admin/inventory/products/${id}`, payload);
  return data;
}

export async function registerMovement(id: number, payload: StockMovementRequest): Promise<ProductResponse> {
  const { data } = await apiClient.post<ProductResponse>(`/api/admin/inventory/products/${id}/movement`, payload);
  return data;
}
