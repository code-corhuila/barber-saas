export interface ServiceRequest {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

export interface ServiceResponse {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}