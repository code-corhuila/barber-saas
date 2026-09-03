import { apiClient } from './client';
import { UserResponse } from '../types/user';

export async function getCurrentUser(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>('/api/users/me');
  return data;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}

export async function updateProfile(payload: UpdateProfileRequest): Promise<UserResponse> {
  const { data } = await apiClient.put<UserResponse>('/api/users/me', payload);
  return data;
}

export interface PickedPhoto {
  uri: string;
  /** En web, expo-image-picker ya entrega el File real -- usarlo directo
   * evita tener que re-leer la blob: URL con fetch(). En nativo no viene
   * (ahi se usa uri con fetch()). */
  file?: Blob;
}

/** Sube una foto de perfil (multipart) al backend. */
export async function uploadProfilePhoto(photo: PickedPhoto): Promise<UserResponse> {
  const blob = photo.file ?? (await (await fetch(photo.uri)).blob());

  const formData = new FormData();
  formData.append('file', blob, 'profile.jpg');

  // apiClient tiene Content-Type: application/json fijo por defecto para
  // todas las peticiones. Para esta en particular hay que ANULARLO (no
  // fijarlo a "multipart/form-data" a mano, eso le falta el boundary):
  // dejando el header en undefined, el navegador genera el
  // "multipart/form-data; boundary=..." correcto el solo. Sin este
  // override, el backend recibia un body multipart con Content-Type
  // application/json y no lo podia leer.
  const { data } = await apiClient.post<UserResponse>('/api/users/me/photo', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}
