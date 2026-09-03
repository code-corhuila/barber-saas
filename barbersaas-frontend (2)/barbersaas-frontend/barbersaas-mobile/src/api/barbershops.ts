import { apiClient } from './client';
import { BarbershopResponse, ServiceResponse, BarberPublicResponse, ReviewResponse, AvailableSlotResponse } from '../types/barbershop';

export async function searchBarbershops(params: { lat?: number; lng?: number; city?: string }): Promise<BarbershopResponse[]> {
  const { data } = await apiClient.get<BarbershopResponse[]>('/api/public/barbershops', { params });
  return data;
}

export async function getBarbershopById(id: number): Promise<BarbershopResponse> {
  const { data } = await apiClient.get<BarbershopResponse>(`/api/public/barbershops/${id}`);
  return data;
}

export async function getBarbershopServices(barbershopId: number): Promise<ServiceResponse[]> {
  const { data } = await apiClient.get<ServiceResponse[]>(`/api/public/barbershops/${barbershopId}/services`);
  return data;
}

export async function getBarbershopBarbers(barbershopId: number): Promise<BarberPublicResponse[]> {
  const { data } = await apiClient.get<BarberPublicResponse[]>(`/api/public/barbershops/${barbershopId}/barbers`);
  return data;
}

export async function getBarbershopReviews(barbershopId: number): Promise<ReviewResponse[]> {
  const { data } = await apiClient.get<ReviewResponse[]>(`/api/public/barbershops/${barbershopId}/reviews`);
  return data;
}

export async function getAvailability(params: { barberId: number; serviceId: number; date: string }): Promise<AvailableSlotResponse[]> {
  const { data } = await apiClient.get<AvailableSlotResponse[]>('/api/public/availability', { params });
  return data;
}