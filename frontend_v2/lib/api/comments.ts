import apiClient from './client';
import { User } from './auth';
import { PaginatedResponse } from './events';

export interface Comment {
  id: number;
  text: string;
  event_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface CommentCreateData {
  text: string;
}

export interface CommentUpdateData {
  text: string;
}

const commentsService = {
  // Получение комментариев к событию
  getEventComments: async (eventId: number, page = 1, limit = 10): Promise<PaginatedResponse<Comment> | Comment[]> => {
    const response = await apiClient.get<PaginatedResponse<Comment> | Comment[]>(`/api/events/${eventId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Создание нового комментария
  createComment: async (eventId: number, data: CommentCreateData): Promise<Comment> => {
    const response = await apiClient.post<Comment>(`/api/events/${eventId}/comments`, data);
    return response.data;
  },

  // Обновление комментария
  updateComment: async (
    eventId: number,
    commentId: number,
    data: CommentUpdateData
  ): Promise<Comment> => {
    const response = await apiClient.put<Comment>(`/api/events/${eventId}/comments/${commentId}`, data);
    return response.data;
  },

  // Удаление комментария
  deleteComment: async (eventId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/api/events/${eventId}/comments/${commentId}`);
  }
};

export default commentsService; 