import apiClient from './client';
import { User } from './auth';

export interface Comment {
  id: number;
  text: string;
  created_at: string;
  updated_at: string;
  user: User;
  event_id: number;
}

export interface CommentCreateData {
  text: string;
}

export interface CommentUpdateData {
  text: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const commentsService = {
  // Get comments for an event
  getEventComments: async (eventId: number, skip = 0, limit = 100): Promise<Comment[]> => {
    const response = await apiClient.get<PaginatedResponse<Comment> | Comment[]>(`/events/${eventId}/comments`, {
      params: { skip, limit },
    });
    return Array.isArray(response.data) ? response.data : response.data.items;
  },

  // Create a new comment
  createComment: async (eventId: number, data: CommentCreateData): Promise<Comment> => {
    const response = await apiClient.post<Comment>(`/events/${eventId}/comments`, data);
    return response.data;
  },

  // Update a comment
  updateComment: async (eventId: number, commentId: number, data: CommentUpdateData): Promise<Comment> => {
    const response = await apiClient.put<Comment>(`/events/${eventId}/comments/${commentId}`, data);
    return response.data;
  },

  // Delete a comment
  deleteComment: async (eventId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/comments/${commentId}`);
  }
};

export default commentsService; 