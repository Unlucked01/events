'use client';

import { Avatar, AvatarProps } from '@mui/material';
import { resolveImageUrl } from '@/lib/utils/image';

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'children'> {
  src?: string | null;
  name?: string | null;
  userId?: number;
}

// Функция для генерации цвета на основе имени или ID
function stringToColor(string: string): string {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

// Функция для получения первых букв имени
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0]?.toUpperCase() || '?';
}

export default function UserAvatar({ 
  src, 
  name, 
  userId, 
  sx = {}, 
  ...props 
}: UserAvatarProps) {
  // Проверяем есть ли действительное изображение
  const hasImage = src && src !== null && !src.includes('data:image/svg+xml');
  
  if (hasImage) {
    // Если есть изображение, показываем его
    return (
      <Avatar
        src={resolveImageUrl(src)}
        sx={sx}
        {...props}
      />
    );
  }

  // Если нет изображения, показываем инициалы на цветном фоне
  const displayName = name || `User${userId || ''}`;
  const initials = getInitials(displayName);
  const backgroundColor = stringToColor(displayName);

  return (
    <Avatar
      sx={{
        bgcolor: backgroundColor,
        color: 'white',
        fontWeight: 600,
        ...sx,
      }}
      {...props}
    >
      {initials}
    </Avatar>
  );
} 