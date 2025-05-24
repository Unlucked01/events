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
  
  // Для относительных путей, добавляем базовый URL и /static prefix
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://unl-events.duckdns.org';
  
  // Убираем leading slash если есть
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Формируем правильный URL: baseUrl/static/uploads/...
  return `${baseUrl}/static/${cleanPath}`;
}

// Функция для сжатия изображения
export function compressImage(file: File, maxWidth = 1024, maxHeight = 768, quality = 0.5): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img;
      
      // Для очень больших изображений используем более агрессивное сжатие
      let finalMaxWidth = maxWidth;
      let finalMaxHeight = maxHeight;
      let finalQuality = quality;
      
      if (file.size > 5 * 1024 * 1024) { // > 5MB
        finalMaxWidth = 800;
        finalMaxHeight = 600;
        finalQuality = 0.3;
      } else if (file.size > 2 * 1024 * 1024) { // > 2MB
        finalMaxWidth = 900;
        finalMaxHeight = 675;
        finalQuality = 0.4;
      }
      
      if (width > finalMaxWidth) {
        height = (height * finalMaxWidth) / width;
        width = finalMaxWidth;
      }
      
      if (height > finalMaxHeight) {
        width = (width * finalMaxHeight) / height;
        height = finalMaxHeight;
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
            
            // Если файл все еще слишком большой (> 1MB), попробуем еще больше сжать
            if (compressedFile.size > 1024 * 1024 && finalQuality > 0.1) {
              // Рекурсивно сжимаем с еще более низким качеством
              compressImage(compressedFile, finalMaxWidth * 0.8, finalMaxHeight * 0.8, finalQuality * 0.5)
                .then(resolve);
              return;
            }
            
            resolve(compressedFile);
          } else {
            // Если сжатие не удалось, возвращаем оригинальный файл
            resolve(file);
          }
        },
        file.type,
        finalQuality
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
export async function compressImages(files: File[], maxWidth = 1024, maxHeight = 768, quality = 0.5): Promise<File[]> {
  const compressedFiles: File[] = [];
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      console.log(`Исходный размер ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      const compressedFile = await compressImage(file, maxWidth, maxHeight, quality);
      console.log(`Сжатый размер ${file.name}: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      compressedFiles.push(compressedFile);
    } else {
      // Если это не изображение, добавляем как есть
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
} 