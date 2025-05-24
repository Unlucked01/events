import apiClient from './client';
import { User } from './auth';
import { compressImages } from '../utils/image';

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  creator: User;
  images: string[];
  is_finished: boolean;
}

export interface EventCreateData {
  title: string;
  description: string;
  location: string;
  event_date: string;
  invitees?: number[];
  images?: File[];
}

export interface EventUpdateData {
  title?: string;
  description?: string;
  location?: string;
  event_date?: string;
  invitees?: number[];
  images?: File[];
  existing_images?: string[];
}

export interface EventResponse {
  id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  creator: User;
  images: string[];
  is_finished: boolean;
  participants: User[];
  invitees: User[];
}

export interface EventListParams {
  page?: number;
  limit?: number;
  search?: string;
  from_date?: string;
  to_date?: string;
  skip?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ParticipantResponse {
  id: number;
  user: User;
  event_id: number;
}

const eventsService = {
  // Получение списка всех событий
  getEvents: async (params: EventListParams = {}): Promise<PaginatedResponse<Event>> => {
    try {
      console.log('Fetching all events with params:', params);
      const response = await apiClient.get<any>('/api/events', { params });
      console.log('Events API response:', response);
      
      // Проверяем структуру ответа
      if (response.data) {
        // Проверим, не является ли ответ прямым массивом вместо объекта PaginatedResponse
        if (Array.isArray(response.data)) {
          return {
            items: response.data,
            total: response.data.length,
            page: 1,
            limit: response.data.length,
            pages: 1
          };
        } else if (response.data.items) {
          return response.data;
        } else {
          console.warn('Unexpected response format from getEvents API call:', response.data);
          return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
        }
      } else {
        return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
      }
    } catch (error) {
      console.error('Get events error:', error);
      // Возвращаем пустой результат в случае ошибки, чтобы избежать крашей UI
      return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
    }
  },

  // Получение ленты событий (от подписок)
  getFeedEvents: async (params: EventListParams = {}): Promise<PaginatedResponse<Event>> => {
    try {
      console.log('Fetching feed events with params:', params);
      const response = await apiClient.get<any>('/api/events/feed', { params });
      console.log('Feed events API response:', response);
      
      // Проверяем структуру ответа
      if (response.data) {
        // Проверим, не является ли ответ прямым массивом вместо объекта PaginatedResponse
        if (Array.isArray(response.data)) {
          return {
            items: response.data,
            total: response.data.length,
            page: 1,
            limit: response.data.length,
            pages: 1
          };
        } else if (response.data.items) {
          return response.data;
        } else {
          console.warn('Unexpected response format from getFeedEvents API call:', response.data);
          return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
        }
      } else {
        return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
      }
    } catch (error) {
      console.error('Get feed events error:', error);
      return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
    }
  },

  // Получение событий пользователя
  getUserEvents: async (userId: number, params: EventListParams = {}): Promise<PaginatedResponse<Event>> => {
    try {
      console.log(`Fetching user events for userId=${userId} with params:`, params);
      const response = await apiClient.get<any>(`/api/events/users/${userId}`, { params });
      console.log(`User events API response:`, response);
      
      // Проверяем структуру ответа
      if (response.data) {
        // Проверим, не является ли ответ прямым массивом вместо объекта PaginatedResponse
        if (Array.isArray(response.data)) {
          console.log('Response is an array, wrapping in PaginatedResponse format');
          return {
            items: response.data,
            total: response.data.length,
            page: 1,
            limit: response.data.length,
            pages: 1
          };
        } else if (response.data.items) {
          // Нормальный формат PaginatedResponse
          return response.data;
        } else {
          // Неожиданный формат ответа
          console.warn('Unexpected response format from getUserEvents API call:', response.data);
          return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
        }
      } else {
        console.warn('Empty response data from getUserEvents API call');
        return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
      }
    } catch (error) {
      console.error(`Get user events error (userId=${userId}):`, error);
      return { items: [], total: 0, page: 1, limit: 10, pages: 0 };
    }
  },

  // Получение информации о конкретном событии
  getEvent: async (id: number): Promise<EventResponse> => {
    const response = await apiClient.get<EventResponse>(`/api/events/${id}`);
    return response.data;
  },

  // Создание нового события
  createEvent: async (data: EventCreateData): Promise<Event> => {
    const formData = new FormData();
    
    // Добавляем основные поля
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('location', data.location);
    formData.append('event_date', data.event_date);
    
    // Добавляем приглашенных пользователей
    if (data.invitees?.length) {
      data.invitees.forEach((inviteeId) => {
        formData.append('invitees', inviteeId.toString());
      });
    }
    
    // Сжимаем и добавляем изображения
    if (data.images?.length) {
      const compressedImages = await compressImages(data.images, 1920, 1080, 0.7);
      compressedImages.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const response = await apiClient.post<Event>('/api/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Обновление события
  updateEvent: async (id: number, data: EventUpdateData): Promise<Event> => {
    const formData = new FormData();
    
    // Добавляем основные поля, которые нужно обновить
    if (data.title) formData.append('title', data.title);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.location) formData.append('location', data.location);
    if (data.event_date) formData.append('event_date', data.event_date);
    
    // Добавляем существующие изображения как JSON
    if (data.existing_images) {
      formData.append('existing_images', JSON.stringify(data.existing_images));
    }
    
    // Добавляем приглашенных пользователей
    if (data.invitees?.length) {
      formData.append('invited_users', JSON.stringify(data.invitees));
    }
    
    // Сжимаем и добавляем изображения
    if (data.images?.length) {
      const compressedImages = await compressImages(data.images, 1920, 1080, 0.7);
      compressedImages.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const response = await apiClient.put<Event>(`/api/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Удаление события
  deleteEvent: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/events/${id}`);
  },

  // Удаление изображения события
  deleteEventImage: async (eventId: number, imageId: number): Promise<void> => {
    await apiClient.delete(`/api/events/${eventId}/images/${imageId}`);
  },

  // Присоединение к событию
  joinEvent: async (id: number): Promise<void> => {
    await apiClient.post(`/api/events/${id}/join`);
  },

  // Отказ от участия в событии
  leaveEvent: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/events/${id}/leave`);
  },

  // Получение списка участников события
  getEventParticipants: async (eventId: number): Promise<ParticipantResponse[]> => {
    const response = await apiClient.get<ParticipantResponse[]>(`/api/events/${eventId}/participants`);
    return response.data;
  }
};

export default eventsService; 