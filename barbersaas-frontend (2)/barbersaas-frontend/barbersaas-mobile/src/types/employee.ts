export type EmployeeRole = 'ADMIN_BARBERSHOP' | 'BARBER';

export interface EmployeeResponse {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  barberProfileId: number | null;
  /** Solo aplica si role = BARBER. Null = usa el % por defecto de la barberia. */
  commissionPercentage: number | null;
}

export interface UpdateBarberCommissionRequest {
  commissionPercentage: number | null;
}

export interface BarberPayrollResponse {
  barberProfileId: number;
  userId: number;
  barberName: string;
  cutsCount: number;
  totalRevenue: number;
  commissionPercentage: number;
  usesDefaultCommission: boolean;
  amountToPay: number;
}

export interface CreateEmployeeRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: EmployeeRole;
  experienceYears?: number;
  bio?: string;
}