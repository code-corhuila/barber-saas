export interface BarbershopAdminResponse {
  id: number;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  status: string; // ACTIVE | SUSPENDED | TRIAL
  planId: number | null;
  planName: string | null;
  createdAt: string;
}
export interface BarbershopCreateRequest {
  name: string;
  address?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  whatsappNumber?: string;
  logoUrl?: string;
  planId: number;
  timezone?: string;
  cancellationPolicyHours?: number;
}

export interface CreateOwnerRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface EmployeeResponseLite {
  id: number;
  fullName: string;
  email: string;
}

export interface BarbershopCreateRequest {
  name: string;
  address?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  whatsappNumber?: string;
  logoUrl?: string;
  planId: number;
  timezone?: string;
  cancellationPolicyHours?: number;
}

export interface CreateOwnerRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface EmployeeResponseLite {
  id: number;
  fullName: string;
  email: string;
}