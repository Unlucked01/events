import apiClient from './client';
import { User } from './auth';
import { PaginatedResponse } from './events';

export interface SubscriptionResponse {
  id: number;
  follower_id: number;
  followed_id: number;
  created_at: string;
  follower: User;
  followed: User;
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  skip?: number;
}

const subscriptionsService = {
  // Получение списка подписчиков пользователя
  getFollowers: async (userId: number, params: UserSearchParams = {}): Promise<PaginatedResponse<SubscriptionResponse> | SubscriptionResponse[]> => {
    const response = await apiClient.get<PaginatedResponse<SubscriptionResponse> | SubscriptionResponse[]>(`/api/users/${userId}/followers`, { params });
    return response.data;
  },

  // Получение списка подписок пользователя
  getFollowing: async (userId: number, params: UserSearchParams = {}): Promise<PaginatedResponse<SubscriptionResponse> | SubscriptionResponse[]> => {
    const response = await apiClient.get<PaginatedResponse<SubscriptionResponse> | SubscriptionResponse[]>(`/api/users/${userId}/following`, { params });
    return response.data;
  },

  // Подписка на пользователя
  follow: async (userId: number): Promise<SubscriptionResponse> => {
    const response = await apiClient.post<SubscriptionResponse>(`/api/users/${userId}/follow`);
    return response.data;
  },

  // Отписка от пользователя
  unfollow: async (userId: number): Promise<void> => {
    await apiClient.delete(`/api/users/${userId}/follow`);
  },

  // Поиск пользователей
  searchUsers: async (params: UserSearchParams = {}): Promise<PaginatedResponse<User> | User[]> => {
    const response = await apiClient.get<PaginatedResponse<User> | User[]>('/api/users/search', { params });
    return response.data;
  }
};

export default subscriptionsService; 