import { apiClient } from './client';
import { LoyaltyCardResponse, LoyaltyConfigResponse, LoyaltyConfigRequest, GrantStickerRequest, CouponStatusResponse } from '../types/loyalty';

export async function getMyLoyaltyCard(barbershopId: number): Promise<LoyaltyCardResponse> {
  const { data } = await apiClient.get<LoyaltyCardResponse>(`/api/client/loyalty/${barbershopId}`);
  return data;
}

export async function getLoyaltyConfig(barbershopId: number): Promise<LoyaltyConfigResponse> {
  const { data } = await apiClient.get<LoyaltyConfigResponse>(`/api/public/barbershops/${barbershopId}/loyalty/config`);
  return data;
}

export async function setLoyaltyConfig(payload: LoyaltyConfigRequest): Promise<LoyaltyConfigResponse> {
  const { data } = await apiClient.put<LoyaltyConfigResponse>('/api/admin/loyalty/config', payload);
  return data;
}

export async function grantSticker(payload: GrantStickerRequest): Promise<LoyaltyCardResponse> {
  const { data } = await apiClient.post<LoyaltyCardResponse>('/api/admin/loyalty/grant', payload);
  return data;
}

export async function redeemReward(clientId: number): Promise<LoyaltyCardResponse> {
  const { data } = await apiClient.post<LoyaltyCardResponse>(`/api/admin/loyalty/redeem/${clientId}`);
  return data;
}

export async function getCouponStatus(barbershopId: number): Promise<CouponStatusResponse> {
  const { data } = await apiClient.get<CouponStatusResponse>(`/api/client/loyalty/${barbershopId}/coupon`);
  return data;
}