import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  
  // Сброс ошибки если src изменился
  useEffect(() => {
    setImgError(false);
  }, [src]);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // Проверка, является ли src строкой и корректным URL
  const isValidSrc = typeof src === 'string' && (
    src.startsWith('data:') || 
    src.startsWith('http://') || 
    src.startsWith('https://') || 
    src.startsWith('blob:')
  );

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {isValidSrc && !imgError ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => {
            console.error('Ошибка загрузки изображения аватара:', src);
            setImgError(true);
          }}
        />
      ) : name ? (
        <span className="text-gray-600 font-medium">
          {getInitials(name)}
        </span>
      ) : (
        <span className="text-gray-400">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </span>
      )}
    </div>
  );
} 