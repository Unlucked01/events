import apiClient from './client';

const telegramService = {
  // Связывание аккаунта с Telegram
  linkTelegramAccount: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/telegram/link-token', {
      token,
    });
    return response.data;
  },

  // Получение ссылки для привязки Telegram
  getTelegramLinkToken: async (): Promise<string> => {
    const response = await apiClient.post('/telegram/link-token');
    return response.data.deep_link || response.data.link;
  },
};

export default telegramService; 