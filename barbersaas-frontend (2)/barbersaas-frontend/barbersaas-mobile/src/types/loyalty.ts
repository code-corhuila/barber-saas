import { apiClient } from "../api/client";

export interface LoyaltyCardResponse {
  id: number;
  clientId: number;
  clientName: string;
  stickersCount: number;
  stickersRequired: number;
  totalRewardsRedeemed: number;
  canRedeem: boolean;
  rewardDescription: string;
}

export interface LoyaltyConfigResponse {
  id: number;
  stickersRequired: number;
  rewardDescription: string;
  isActive: boolean;
}

export interface LoyaltyConfigRequest {
  stickersRequired: number;
  rewardDescription: string;
}

export interface GrantStickerRequest {
  clientId: number;
  appointmentId?: number;
}

export interface ClientSearchResponse {
  clientId: number;
  fullName: string;
  email: string;
}

export async function searchClients(query: string): Promise<ClientSearchResponse[]> {
  const { data } = await apiClient.get<ClientSearchResponse[]>('/api/admin/loyalty/clients/search', {
    params: { query },
  });
  return data;
}

export async function getClientLoyaltyCard(clientId: number): Promise<LoyaltyCardResponse> {
  const { data } = await apiClient.get<LoyaltyCardResponse>(`/api/admin/loyalty/clients/${clientId}`);
  return data;
}

export interface CouponStatusResponse {
  hasActiveCoupon: boolean;
}

