import apiClient from './client';
import { User } from './auth';

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: User;
  event_id: number;
}

export interface ReviewCreateData {
  rating: number;
  comment: string;
}

export interface ReviewUpdateData {
  rating?: number;
  comment?: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  average_rating: number;
  total_reviews: number;
}

const reviewsService = {
  // Get reviews for an event
  getEventReviews: async (eventId: number, skip = 0, limit = 100): Promise<ReviewsResponse> => {
    const response = await apiClient.get<ReviewsResponse>(`/events/${eventId}/reviews`, {
      params: { skip, limit },
    });
    return response.data;
  },

  // Create a new review
  createReview: async (eventId: number, data: ReviewCreateData): Promise<Review> => {
    const response = await apiClient.post<Review>(`/events/${eventId}/reviews`, data);
    return response.data;
  },

  // Update a review
  updateReview: async (reviewId: number, data: ReviewUpdateData): Promise<Review> => {
    const response = await apiClient.put<Review>(`/events/reviews/${reviewId}`, data);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId: number): Promise<void> => {
    await apiClient.delete(`/events/reviews/${reviewId}`);
  }
};

export default reviewsService; 