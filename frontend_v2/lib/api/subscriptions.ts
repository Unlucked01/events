import apiClient from './client';
import { User } from './auth';

export interface UserSearchParams {
  query?: string;
  skip?: number;
  limit?: number;
}

export interface SubscriptionDisplay {
  id: number;
  follower: User;
  followed: User;
  created_at: string;
}

const subscriptionsService = {
  // Подписаться на пользователя
  followUser: async (userId: number): Promise<SubscriptionDisplay> => {
    const response = await apiClient.post<SubscriptionDisplay>(`/users/${userId}/follow`);
    return response.data;
  },

  // Отписаться от пользователя
  unfollowUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}/unfollow`);
  },

  // Получить подписчиков пользователя
  getFollowers: async (userId: number, params: { skip?: number; limit?: number } = {}): Promise<SubscriptionDisplay[]> => {
    try {
      const response = await apiClient.get<SubscriptionDisplay[]>(`/users/${userId}/followers`, { params });
      console.log('Followers API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get followers error:', error);
      return [];
    }
  },

  // Получить подписки пользователя
  getFollowing: async (userId: number, params: { skip?: number; limit?: number } = {}): Promise<SubscriptionDisplay[]> => {
    try {
      const response = await apiClient.get<SubscriptionDisplay[]>(`/users/${userId}/following`, { params });
      console.log('Following API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get following error:', error);
      return [];
    }
  },

  // Проверить, подписан ли текущий пользователь на другого пользователя
  checkIsFollowing: async (userId: number): Promise<boolean> => {
    try {
      const response = await apiClient.get<{ is_following: boolean }>(`/users/${userId}/is-following`);
      return response.data.is_following;
    } catch (error) {
      console.error('Check is following error:', error);
      return false;
    }
  },

  // Поиск пользователей
  searchUsers: async (params: UserSearchParams = {}): Promise<User[]> => {
    try {
      console.log('Searching users with params:', params);
      
      // Backend ожидает обязательный параметр query (минимум 3 символа)
      if (!params.query || params.query.length < 3) {
        console.log('Query too short or missing, returning empty array');
        return [];
      }
      
      const searchParams = {
        query: params.query,
        skip: params.skip || 0,
        limit: params.limit || 10,
      };
      
      console.log('Sending search request with params:', searchParams);
      const response = await apiClient.get<User[]>('/users/search', { params: searchParams });
      console.log('Search users API response:', response);
      
      // Backend возвращает массив пользователей напрямую
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Unexpected response format from searchUsers API call:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  },
};

export default subscriptionsService; 