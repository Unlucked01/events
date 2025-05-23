import apiClient from './client';

export async function getTelegramLinkToken(): Promise<string> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Нет токена авторизации');

  const response = await apiClient.post('/api/telegram/link-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status !== 200) {
    let message = 'Ошибка при получении ссылки';
    try {
      const data = response.data;
      message = data.message || message;
    } catch {}
    throw new Error(message);
  }

  const data = response.data;
  if (!data.deep_link) throw new Error('Ссылка не получена');
  return data.deep_link;
} 