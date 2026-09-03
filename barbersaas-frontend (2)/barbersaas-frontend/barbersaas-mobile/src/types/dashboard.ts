export interface TopServiceItem {
  serviceId: number;
  serviceName: string;
  totalBookings: number;
}

export interface TopBarberItem {
  barberProfileId: number;
  barberName: string;
  totalAppointments: number;
}

export interface PeakHourItem {
  hourOfDay: number;
  totalAppointments: number;
}

export interface BarbershopDashboardResponse {
  salesToday: number;
  salesThisWeek: number;
  salesThisMonth: number;
  totalClients: number;
  newClientsThisMonth: number;
  recurringClients: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  totalAppointmentsInRange: number;
  cancellationRate: number;
  topServices: TopServiceItem[];
  topBarbers: TopBarberItem[];
  peakHours: PeakHourItem[];
}