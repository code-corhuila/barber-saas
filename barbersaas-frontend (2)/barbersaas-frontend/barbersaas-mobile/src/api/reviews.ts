import { apiClient } from './client';
import { CreateReviewRequest } from '../types/review';
import { ReviewResponse } from '../types/barbershop';

export async function createReview(payload: CreateReviewRequest): Promise<ReviewResponse> {
  const { data } = await apiClient.post<ReviewResponse>('/api/client/reviews', payload);
  return data;
}
