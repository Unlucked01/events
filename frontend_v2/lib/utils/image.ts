/**
 * Resolves an image URL correctly for both local and remote images
 * @param path The image path or URL to resolve
 * @returns A properly formatted URL for the image
 */
export function resolveImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    // Возвращаем серый placeholder в виде data URL
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }
  
  // Если это уже полный URL, возвращаем как есть
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Если это относительный путь, добавляем базовый URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://unl-events.duckdns.org';
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

// Функция для сжатия изображения
export function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Рисуем изображение на canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Конвертируем canvas в blob, затем в file
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            // Если сжатие не удалось, возвращаем оригинальный файл
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      // Если загрузка изображения не удалась, возвращаем оригинальный файл
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// Функция для сжатия массива изображений
export async function compressImages(files: File[], maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File[]> {
  const compressedFiles: File[] = [];
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const compressedFile = await compressImage(file, maxWidth, maxHeight, quality);
      compressedFiles.push(compressedFile);
    } else {
      // Если это не изображение, добавляем как есть
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
} 