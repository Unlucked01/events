import apiClient from './client';
import { User } from './auth';

export interface Review {
  id: number;
  text?: string;
  rating: number;
  event_id: number;
  user: User;
  created_at: string;
}

export interface ReviewCreateData {
  text?: string;
  rating: number;
}

export interface ReviewUpdateData {
  text?: string;
  rating?: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  average_rating: number;
}

const reviewsService = {
  // Get reviews for an event
  getEventReviews: async (eventId: number, skip = 0, limit = 100): Promise<ReviewsResponse> => {
    const response = await apiClient.get<ReviewsResponse>(`/api/events/${eventId}/reviews`, {
      params: { skip, limit },
    });
    return response.data;
  },

  // Create a new review
  createReview: async (eventId: number, data: ReviewCreateData): Promise<Review> => {
    const response = await apiClient.post<Review>(`/api/events/${eventId}/reviews`, data);
    return response.data;
  },

  // Update a review
  updateReview: async (reviewId: number, data: ReviewUpdateData): Promise<Review> => {
    const response = await apiClient.put<Review>(`/api/events/reviews/${reviewId}`, data);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId: number): Promise<void> => {
    await apiClient.delete(`/api/events/reviews/${reviewId}`);
  }
};

export default reviewsService; 