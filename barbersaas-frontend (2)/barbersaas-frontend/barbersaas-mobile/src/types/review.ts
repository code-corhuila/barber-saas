export interface CreateReviewRequest {
  barbershopId: number;
  barberProfileId?: number;
  appointmentId?: number;
  rating: number;
  comment?: string;
}
