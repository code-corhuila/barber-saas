import { apiClient } from './client';
import { FinanceRecordRequest, FinanceRecordResponse, FinanceSummaryResponse } from '../types/finance';

export async function createFinanceRecord(payload: FinanceRecordRequest): Promise<FinanceRecordResponse> {
  const { data } = await apiClient.post<FinanceRecordResponse>('/api/admin/finance/records', payload);
  return data;
}

export async function getFinanceRecords(from: string, to: string): Promise<FinanceRecordResponse[]> {
  const { data } = await apiClient.get<FinanceRecordResponse[]>('/api/admin/finance/records', {
    params: { from, to },
  });
  return data;
}

export async function getFinanceSummary(from: string, to: string): Promise<FinanceSummaryResponse> {
  const { data } = await apiClient.get<FinanceSummaryResponse>('/api/admin/finance/summary', {
    params: { from, to },
  });
  return data;
}
