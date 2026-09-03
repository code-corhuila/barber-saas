export type MovementType = 'IN' | 'OUT';

export interface ProductRequest {
  name: string;
  description?: string;
  unit: string;
  currentStock: number;
  minStockAlert: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  currentStock: number;
  minStockAlert: number;
  lowStock: boolean;
}

export interface StockMovementRequest {
  movementType: MovementType;
  quantity: number;
  reason?: string;
}
