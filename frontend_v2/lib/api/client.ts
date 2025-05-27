import axios from 'axios';

// Базовый URL API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://unl-events.duckdns.org';

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Важно для CORS-запросов
});

// Перехватчик запросов для добавления токена авторизации
apiClient.interceptors.request.use(
  (config) => {
    // Получаем токен из localStorage при запросе
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Детальное логирование ошибок API для отладки
    if (error.response) {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response.status}`,
        error.response.data
      );
    } else if (error.request) {
      console.error('[API Error] No response received', {
        request: error.request,
        url: error.config?.url,
        method: error.config?.method,
      });
    } else {
      console.error('[API Error]', error.message);
    }
    
    // Обработка 401 ошибки (Unauthorized)
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        // Удаляем токен и перенаправляем на страницу входа
        localStorage.removeItem('token');
        
        // Проверяем, не находится ли пользователь уже на странице логина
        const isLoginPage = window.location.pathname.includes('/auth/login');
        if (!isLoginPage) {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 