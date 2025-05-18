import apiClient from './client';
import { User } from './auth';

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  phone?: string;
  telegram_username?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

const profileService = {
  // Обновление профиля пользователя (без аватара)
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const formData = new FormData();
    
    if (data.username) formData.append('username', data.username);
    if (data.full_name) formData.append('full_name', data.full_name);
    if (data.phone) formData.append('phone', data.phone);
    if (data.telegram_username) formData.append('telegram_username', data.telegram_username);
    
    const response = await apiClient.put<User>('/api/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Обновление аватара профиля
  updateProfilePicture: async (avatar: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profile_picture', avatar);
    
    const response = await apiClient.put<User>('/api/users/me/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Изменение пароля
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await apiClient.post('/api/users/me/change-password', data);
  },

  // Получение профиля другого пользователя
  getUserProfile: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`/api/users/${userId}`);
    return response.data;
  }
};

export default profileService; 