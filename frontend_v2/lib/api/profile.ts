import apiClient from './client';
import { User } from './auth';

export interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  phone?: string;
  profile_picture?: File;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

const profileService = {
  // Обновление профиля
  updateProfile: async (data: ProfileUpdateData): Promise<User> => {
    const formData = new FormData();
    
    if (data.username) formData.append('username', data.username);
    if (data.full_name) formData.append('full_name', data.full_name);
    if (data.phone) formData.append('phone', data.phone);
    if (data.profile_picture) formData.append('profile_picture', data.profile_picture);
    
    const response = await apiClient.put<User>('/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Обновление аватара
  updateProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    const response = await apiClient.put<User>('/users/me/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Изменение пароля
  changePassword: async (data: PasswordChangeData): Promise<void> => {
    await apiClient.post('/users/me/change-password', data);
  },

  // Получение профиля пользователя по ID
  getUserProfile: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  },
};

export default profileService; 