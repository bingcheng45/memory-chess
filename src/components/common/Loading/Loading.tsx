'use client';

import React from 'react';

interface LoadingProps {
  className?: string;
}

export function Loading({ className = '' }: LoadingProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
} 