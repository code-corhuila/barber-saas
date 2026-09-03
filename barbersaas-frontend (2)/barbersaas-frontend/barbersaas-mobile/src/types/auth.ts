export type Role = 'SUPER_ADMIN' | 'ADMIN_BARBERSHOP' | 'BARBER' | 'CLIENT';

export interface AuthResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  barbershopId: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface SelfRegisterBarbershopRequest {
  ownerFullName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone: string;
  barbershopName: string;
  address?: string;
  city: string;
  barbershopPhone: string;
  planId: number;
}