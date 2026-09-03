export interface PlatformDashboardResponse {
  totalBarbershops: number;
  activeBarbershops: number;
  suspendedBarbershops: number;
  trialBarbershops: number;
  totalClients: number;
  totalAppointments: number;
  totalPlatformRevenue: number;
  mostActiveBarbershops: MostActiveBarbershopItem[];
}

export interface MostActiveBarbershopItem {
  barbershopId: number;
  name: string;
  totalAppointments: number;
}

export interface SubscriptionPlanResponse {
  id: number;
  name: string;
  price: number;
  maxBarbers: number;
  featuresJson: string | null;
  isActive: boolean;
}

export interface SubscriptionPlanRequest {
  name: string;
  price: number;
  maxBarbers: number;
  featuresJson?: string;
}