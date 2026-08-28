'use client';

import { Link } from '@/i18n/navigation';
import SoundSettings from './SoundSettings';
import LanguageSettings from './LanguageSettings';

type PageType = 'game-config' | 'game-memorize-solution' | 'game-result' | 'other';

interface PageHeaderProps {
  onBackClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  showSoundSettings?: boolean;
  showLanguageSettings?: boolean;
  pageType?: PageType;
}

export default function PageHeader({
  onBackClick,
  className = '',
  style,
  showSoundSettings = true,
  showLanguageSettings = true,
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
        // Active gameplay aligns with the board's outer right edge.
        return "right-0";
      case 'other':
      default:
        // Other pages (settings, etc.) - at the absolute right edge
        return "right-0";
    }
  };

  // Horizontal mirror of getPositionClass(), so the language control sits at
  // the same inset from the left edge as the sound control does from the right
  // and the title stays optically centred. Keep the two in sync.
  const getLanguagePositionClass = (): string => {
    switch(pageType) {
      case 'game-config':
        return "left-6 sm:left-14 md:left-30 lg:left-48";
      case 'game-result':
        return "left-6 sm:left-16 md:left-32 lg:left-52";
      case 'game-memorize-solution':
      case 'other':
      default:
        return "left-0";
    }
  };

  return (
    <div className={`relative w-full max-w-4xl mb-8 ${className}`} style={style}>
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
      
      {/* Language switcher, mirrored to the left of the sound control */}
      {showLanguageSettings && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${getLanguagePositionClass()}`}>
          {/* Auto width: the globe + code pill is wider than the sound circle.
              Both still anchor to their respective edges at equal insets, and
              the title is centred independently of either control. */}
          <LanguageSettings className="flex justify-start" />
        </div>
      )}

      {/* Sound settings with positioning based on page type */}
      {showSoundSettings && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${getPositionClass()}`}>
          <SoundSettings className="flex w-[46px] justify-end sm:w-[50px]" />
        </div>
      )}
    </div>
  );
}
