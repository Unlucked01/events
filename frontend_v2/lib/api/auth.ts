import apiClient from './client';

// Типы для аутентификации
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  full_name: string;
  phone: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  phone: string;
  profile_picture?: string;
  telegram_chat_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginData {
  username: string;
  password: string;
}

// Сервис для работы с авторизацией
const authService = {
  // Вход в систему
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      // Создаем FormData для отправки данных в формате form-data
      const form = new FormData();
      form.append('username', data.username);
      form.append('password', data.password);

      const response = await apiClient.post('/auth/login', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Сохраняем токен в localStorage
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        
        // Получаем информацию о пользователе
        const userResponse = await apiClient.get<User>('/users/me');
        
        return {
          ...response.data,
          user: userResponse.data
        };
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Регистрация
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const userData = {
        username: data.username,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
      };

      const response = await apiClient.post<AuthResponse>('/auth/register', userData);

      // Сохраняем токен в localStorage
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  // Выход из системы
  logout: () => {
    localStorage.removeItem('token');
  },
  
  // Получение текущего пользователя
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  // Проверка авторизации
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Получение токена
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
};

export default authService; 