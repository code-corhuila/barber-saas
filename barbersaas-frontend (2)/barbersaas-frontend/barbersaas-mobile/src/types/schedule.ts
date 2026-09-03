export interface DaySchedule {
  dayOfWeek: number; // 0=Domingo ... 6=Sabado
  startTime: string; // "HH:mm"
  endTime: string;
}

export interface BarberScheduleRequest {
  days: DaySchedule[];
}

export interface BarberScheduleResponse {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}