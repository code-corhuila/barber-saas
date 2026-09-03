import { apiClient } from './client';
import { RegisterDeviceTokenRequest, NotificationResponse } from '../types/notifications';

export async function registerDeviceToken(payload: RegisterDeviceTokenRequest): Promise<void> {
  await apiClient.post('/api/notifications/device-token', payload);
}

export async function getMyNotifications(): Promise<NotificationResponse[]> {
  const { data } = await apiClient.get<NotificationResponse[]>('/api/notifications');
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ unreadCount: number }>('/api/notifications/unread-count');
  return data.unreadCount;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await apiClient.patch(`/api/notifications/${id}/read`);
}