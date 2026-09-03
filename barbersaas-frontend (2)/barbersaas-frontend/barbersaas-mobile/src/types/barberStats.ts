export interface BarberStatsResponse {
  appointmentsCompletedThisMonth: number;
  appointmentsCancelledThisMonth: number;
  revenueGeneratedThisMonth: number;
  ratingAvg: number | null;
  ratingCount: number;
  upcomingAppointmentsCount: number;
}