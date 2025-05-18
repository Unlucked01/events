'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { resolveImageUrl } from '@/lib/utils/image';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc = '/placeholders/image-placeholder.jpg',
  alt,
  ...rest
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    src ? resolveImageUrl(src) : fallbackSrc
  );

  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={alt || 'Image'}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
} 