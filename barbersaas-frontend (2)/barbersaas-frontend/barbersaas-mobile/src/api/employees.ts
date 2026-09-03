import { apiClient } from './client';
import {
  EmployeeResponse,
  CreateEmployeeRequest,
  UpdateBarberCommissionRequest,
  BarberPayrollResponse,
} from '../types/employee';

export async function getEmployees(): Promise<EmployeeResponse[]> {
  const { data } = await apiClient.get<EmployeeResponse[]>('/api/admin/employees');
  return data;
}

export async function createEmployee(payload: CreateEmployeeRequest): Promise<EmployeeResponse> {
  const { data } = await apiClient.post<EmployeeResponse>('/api/admin/employees', payload);
  return data;
}

export async function deactivateEmployee(userId: number): Promise<void> {
  await apiClient.patch(`/api/admin/employees/${userId}/deactivate`);
}

export async function getDefaultCommission(): Promise<number> {
  const { data } = await apiClient.get<{ defaultCommissionPercentage: number }>('/api/admin/employees/commission-default');
  return data.defaultCommissionPercentage;
}

export async function updateDefaultCommission(defaultCommissionPercentage: number): Promise<void> {
  await apiClient.patch('/api/admin/employees/commission-default', { defaultCommissionPercentage });
}

export async function updateBarberCommission(userId: number, payload: UpdateBarberCommissionRequest): Promise<void> {
  await apiClient.patch(`/api/admin/employees/${userId}/commission`, payload);
}

export async function getPayroll(from: string, to: string): Promise<BarberPayrollResponse[]> {
  const { data } = await apiClient.get<BarberPayrollResponse[]>('/api/admin/employees/payroll', { params: { from, to } });
  return data;
}