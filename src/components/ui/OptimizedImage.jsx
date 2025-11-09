import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = null,
  aspectRatio = null,
  objectFit = 'cover',
  priority = false 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  // Add Supabase image transformation parameters for optimization
  const optimizedSrc = currentSrc ? `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}quality=85` : '';

  return (
    <div className={`relative overflow-hidden ${className}`} style={aspectRatio ? { aspectRatio } : {}}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400 animate-pulse" />
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center p-4">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Image unavailable</p>
          </div>
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{ objectFit }}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  );
}