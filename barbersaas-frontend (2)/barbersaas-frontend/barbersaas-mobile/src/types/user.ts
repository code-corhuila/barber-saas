export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  role: string;
  barbershopId: number | null;
  barbershopName: string | null;
  isActive: boolean;
}
