export interface RegisterDeviceTokenRequest {
  token: string;
  platform: 'android' | 'ios';
}

export interface NotificationResponse {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}