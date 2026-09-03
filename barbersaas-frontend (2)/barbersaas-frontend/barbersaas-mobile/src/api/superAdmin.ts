import { apiClient } from './client';
import { PlatformDashboardResponse, SubscriptionPlanResponse, SubscriptionPlanRequest } from '../types/superAdmin';
import { BarbershopAdminResponse } from '../types/barbershopAdmin';

export async function getPlatformDashboard(): Promise<PlatformDashboardResponse> {
  const { data } = await apiClient.get<PlatformDashboardResponse>('/api/super-admin/dashboard');
  return data;
}

export async function getAllBarbershops(): Promise<BarbershopAdminResponse[]> {
  const { data } = await apiClient.get<BarbershopAdminResponse[]>('/api/super-admin/barbershops');
  return data;
}

export async function updateBarbershopStatus(id: number, status: string): Promise<BarbershopAdminResponse> {
  const { data } = await apiClient.patch<BarbershopAdminResponse>(`/api/super-admin/barbershops/${id}/status`, { status });
  return data;
}

export async function getPlans(): Promise<SubscriptionPlanResponse[]> {
  const { data } = await apiClient.get<SubscriptionPlanResponse[]>('/api/super-admin/plans');
  return data;
}

export async function createPlan(payload: SubscriptionPlanRequest): Promise<SubscriptionPlanResponse> {
  const { data } = await apiClient.post<SubscriptionPlanResponse>('/api/super-admin/plans', payload);
  return data;
}

export async function updatePlan(id: number, payload: SubscriptionPlanRequest): Promise<SubscriptionPlanResponse> {
  const { data } = await apiClient.put<SubscriptionPlanResponse>(`/api/super-admin/plans/${id}`, payload);
  return data;
}

import { BarbershopCreateRequest, CreateOwnerRequest, EmployeeResponseLite } from '../types/barbershopAdmin';

export async function createBarbershop(payload: BarbershopCreateRequest): Promise<BarbershopAdminResponse> {
  const { data } = await apiClient.post<BarbershopAdminResponse>('/api/super-admin/barbershops', payload);
  return data;
}

export async function createBarbershopOwner(barbershopId: number, payload: CreateOwnerRequest): Promise<EmployeeResponseLite> {
  const { data } = await apiClient.post<EmployeeResponseLite>(`/api/super-admin/barbershops/${barbershopId}/owner`, payload);
  return data;
}