import { apiClient } from './client';
import { GalleryImageResponse } from '../types/gallery';
import { PickedPhoto } from './user';

export async function getBarbershopGallery(barbershopId: number): Promise<GalleryImageResponse[]> {
  const { data } = await apiClient.get<GalleryImageResponse[]>(`/api/public/barbershops/${barbershopId}/gallery`);
  return data;
}

/** Sube una foto real al portafolio (multipart). Mismo patron que uploadProfilePhoto. */
export async function uploadGalleryImage(photo: PickedPhoto, caption?: string): Promise<GalleryImageResponse> {
  const blob = photo.file ?? (await (await fetch(photo.uri)).blob());

  const formData = new FormData();
  formData.append('file', blob, 'gallery.jpg');
  if (caption?.trim()) {
    formData.append('caption', caption.trim());
  }

  const { data } = await apiClient.post<GalleryImageResponse>('/api/admin/gallery/upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

export async function deleteGalleryImage(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/gallery/${id}`);
}
