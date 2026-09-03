import { apiClient } from './client';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';
import { SubscriptionPlanResponse } from '../types/superAdmin';

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload);
  return data;
}

export async function getPublicPlans(): Promise<SubscriptionPlanResponse[]> {
  const { data } = await apiClient.get<SubscriptionPlanResponse[]>('/api/public/plans');
  return data;
}
export async function forgotPassword(payload: { email: string }): Promise<void> {
  await apiClient.post('/api/auth/forgot-password', payload);
}

export async function resetPassword(payload: { email: string; token: string; newPassword: string }): Promise<void> {
  await apiClient.post('/api/auth/reset-password', payload);
}