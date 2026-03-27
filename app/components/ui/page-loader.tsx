import React from 'react';
import { LoadingSpinner } from './loading-spinner';

interface PageLoaderProps {
  message?: string;
  fullPage?: boolean;
}

export function PageLoader({ message = 'Cargando...', fullPage = true }: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6 p-12">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-gray-500 animate-pulse font-medium tracking-wide flex items-center gap-2">
          {message}
          <span className="flex gap-1">
            <span className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1 w-1 bg-primary rounded-full animate-bounce" />
          </span>
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-20">
      {content}
    </div>
  );
}
