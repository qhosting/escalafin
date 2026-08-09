'use client';

import React from 'react';
import { LoadingSpinner } from './loading-spinner';

interface PageLoaderProps {
  message?: string;
  fullPage?: boolean;
}

export function PageLoader({ message = 'Cargando...', fullPage = true }: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-5 p-8 text-center">
      <LoadingSpinner size="md" />
      {message && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium tracking-wide text-slate-700 dark:text-slate-200 animate-pulse flex items-center gap-2">
            {message}
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
            </span>
          </p>
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-16">
      {content}
    </div>
  );
}
