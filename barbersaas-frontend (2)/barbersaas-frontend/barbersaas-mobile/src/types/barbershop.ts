export interface BarbershopResponse {
  id: number;
  name: string;
  address: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsappNumber: string | null;
  logoUrl: string | null;
  status: string;
  planId: number | null;
  planName: string | null;
  timezone: string;
  cancellationPolicyHours: number;
  createdAt: string;
}

export interface ServiceResponse {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export interface BarberPublicResponse {
  id: number;
  fullName: string;
  profilePhotoUrl: string | null;
  experienceYears: number | null;
  ratingAvg: number | null;
  ratingCount: number | null;
}

export interface AvailableSlotResponse {
  startTime: string; // "HH:mm:ss"
  endTime: string;
}

export interface ReviewResponse {
  id: number;
  clientId: number;
  clientName: string;
  barberProfileId: number | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}