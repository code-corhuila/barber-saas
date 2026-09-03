import { DiscountType } from './promotion';

export interface InvoiceSummaryResponse {
  appointmentId: number;
  appointmentDate: string;
  startTime: string;
  barberId: number;
  barberName: string;
  clientName: string;
  serviceName: string;
  total: number;
  hasProducts: boolean;
  promotionTitle: string | null;
}

export interface InvoiceProductLine {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceDetailResponse {
  appointmentId: number;
  barbershopName: string;
  appointmentDate: string;
  startTime: string;
  barberId: number;
  barberName: string;
  clientName: string;
  serviceName: string;
  servicePrice: number;
  products: InvoiceProductLine[];
  productsTotal: number;
  promotionId: number | null;
  promotionTitle: string | null;
  promotionDiscountType: DiscountType | null;
  discountAmount: number;
  total: number;
}

export interface AddInvoiceProductRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface ApplyPromotionRequest {
  promotionId: number;
}
