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
  telegram_username?: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  phone: string;
  avatar?: string;
  profile_picture?: string;
  telegram_chat_id?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Сервис для работы с авторизацией
const authService = {
  // Вход в систему
  login: async (credentials: LoginCredentials) => {
    try {
      const form = new URLSearchParams();
      form.append("username", credentials.username);
      form.append("password", credentials.password);
      
      // FastAPI OAuth2 ожидает данные в формате форм
      const response = await apiClient.post('/api/auth/login', form, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log('Login response:', response.data);
      
      // Сохраняем токен в localStorage
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        
        // Получаем информацию о пользователе отдельным запросом
        const userResponse = await apiClient.get<User>('/api/users/me');
        return {
          access_token: response.data.access_token,
          token_type: response.data.token_type,
          user: userResponse.data
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Регистрация нового пользователя
  register: async (userData: RegisterData) => {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', userData);
      
      // Сохраняем токен сразу после регистрации
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
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<User>('/api/users/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  // Проверка, авторизован ли пользователь
  isAuthenticated: () => {
    if (typeof window === 'undefined') {
      return false;
    }
    return Boolean(localStorage.getItem('token'));
  },
};

export default authService; 