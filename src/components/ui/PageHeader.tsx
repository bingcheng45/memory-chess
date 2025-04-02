'use client';

import Link from 'next/link';
import SoundSettings from './SoundSettings';
import { Button } from './button';

type PageType = 'game-config' | 'game-memorize-solution' | 'game-result' | 'other';

interface PageHeaderProps {
  onBackClick?: () => void;
  onSkipClick?: () => void;
  showSkipButton?: boolean;
  className?: string;
  showSoundSettings?: boolean;
  pageType?: PageType;
}

export default function PageHeader({ 
  onBackClick, 
  onSkipClick,
  showSkipButton = false,
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
        return "right-6 sm:right-14 md:right-30 lg:right-48";
      case 'game-result':
        // Configuration and result phases - keep current positioning
        return "right-6 sm:right-16 md:right-32 lg:right-52";
      case 'game-memorize-solution':
        // Memorization and solution phases - shift slightly to the right
        return "right-6 sm:right-16 md:right-32 lg:right-50";
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
      
      {/* Control buttons with positioning based on page type */}
      <div className={`absolute top-1/2 -translate-y-1/2 ${getPositionClass()} flex items-center space-x-2`}>
        {/* Skip button, only shown during memorization phase */}
        {showSkipButton && onSkipClick && (
          <Button 
            onClick={onSkipClick}
            variant="outline"
            size="sm"
            className="bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5 text-xs h-7"
          >
            Skip
          </Button>
        )}
        
        {/* Sound settings */}
        {showSoundSettings && (
          <SoundSettings className="w-[46px] sm:w-[50px]" />
        )}
      </div>
    </div>
  );
} 