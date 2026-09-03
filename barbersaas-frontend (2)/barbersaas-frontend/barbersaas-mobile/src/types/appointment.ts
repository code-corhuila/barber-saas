export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface AppointmentResponse {
  id: number;
  barbershopId: number;
  clientId: number;
  clientName: string;
  barberId: number;
  barberName: string;
  serviceId: number;
  serviceName: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm:ss"
  endTime: string;
  status: AppointmentStatus;
  priceAtBooking: number;
  notes: string | null;
  cancelledReason: string | null;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  barberId: number;
  serviceId: number;
  appointmentDate: string;
  startTime: string;
  notes?: string;
}

export interface CancelAppointmentRequest {
  reason?: string;
}