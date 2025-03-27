'use client';

import Link from 'next/link';
import SoundSettings from './SoundSettings';

type PageType = 'game-config' | 'game-memorize-solution' | 'game-result' | 'other';

interface PageHeaderProps {
  onBackClick?: () => void;
  className?: string;
  showSoundSettings?: boolean;
  pageType?: PageType;
}

export default function PageHeader({ 
  onBackClick, 
  className = '',
  showSoundSettings = true,
  pageType = 'other'
}: PageHeaderProps) {
  const handleBackClick = (e: React.MouseEvent) => {
    if (onBackClick) {
      e.preventDefault();
      onBackClick();
    }
  };

  // Different positioning classes based on page type
  const getPositionClass = (): string => {
    switch(pageType) {
      case 'game-config':
      case 'game-result':
        // Configuration and result phases - keep current positioning
        return "right-8 sm:right-16 md:right-32 lg:right-48";
      case 'game-memorize-solution':
        // Memorization and solution phases - slight shift to the right (closer to edge)
        return "right-6 sm:right-12 md:right-24 lg:right-40";
      case 'other':
      default:
        // Other pages (settings, etc.) - at the absolute right edge
        return "right-0";
    }
  };

  return (
    <div className={`relative w-full max-w-4xl mb-8 px-1 ${className}`}>
      {/* Title centered in the available space */}
      <div className="flex items-center justify-center">
        <Link 
          href="/"
          onClick={handleBackClick}
          className="text-center text-xl sm:text-3xl font-bold text-text-primary whitespace-nowrap cursor-pointer transition-all hover:opacity-80"
        >
          Memory <span className="text-peach-500">Chess</span>
        </Link>
      </div>
      
      {/* Sound settings with positioning based on page type */}
      {showSoundSettings && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${getPositionClass()}`}>
          <SoundSettings className="w-[46px] sm:w-[50px]" />
        </div>
      )}
    </div>
  );
} 