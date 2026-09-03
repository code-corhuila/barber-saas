export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'TWO_FOR_ONE';

export interface PromotionRequest {
  title: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  validFrom: string; // "YYYY-MM-DD"
  validTo: string;
}

export interface PromotionResponse {
  id: number;
  title: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}
