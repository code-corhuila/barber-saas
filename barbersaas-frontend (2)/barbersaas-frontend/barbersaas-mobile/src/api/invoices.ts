import { apiClient } from './client';
import {
  AddInvoiceProductRequest,
  ApplyPromotionRequest,
  InvoiceDetailResponse,
  InvoiceSummaryResponse,
} from '../types/invoice';
import { AppointmentResponse } from '../types/appointment';

export async function getInvoices(from: string, to: string, barberId?: number | null): Promise<InvoiceSummaryResponse[]> {
  const { data } = await apiClient.get<InvoiceSummaryResponse[]>('/api/admin/invoices', {
    params: { from, to, barberId: barberId ?? undefined },
  });
  return data;
}

export async function getInvoiceDetail(appointmentId: number): Promise<InvoiceDetailResponse> {
  const { data } = await apiClient.get<InvoiceDetailResponse>(`/api/admin/invoices/${appointmentId}`);
  return data;
}

export async function addInvoiceProduct(appointmentId: number, payload: AddInvoiceProductRequest): Promise<InvoiceDetailResponse> {
  const { data } = await apiClient.post<InvoiceDetailResponse>(`/api/admin/invoices/${appointmentId}/products`, payload);
  return data;
}

export async function applyInvoicePromotion(appointmentId: number, payload: ApplyPromotionRequest): Promise<InvoiceDetailResponse> {
  const { data } = await apiClient.post<InvoiceDetailResponse>(`/api/admin/invoices/${appointmentId}/promotion`, payload);
  return data;
}

export async function removeInvoicePromotion(appointmentId: number): Promise<InvoiceDetailResponse> {
  const { data } = await apiClient.delete<InvoiceDetailResponse>(`/api/admin/invoices/${appointmentId}/promotion`);
  return data;
}

export async function getMyBarberHistory(): Promise<AppointmentResponse[]> {
  const { data } = await apiClient.get<AppointmentResponse[]>('/api/barber/history');
  return data;
}
