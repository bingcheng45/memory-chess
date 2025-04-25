'use client';

import React, { useRef } from 'react';
import { useAnalytics } from '@/lib/utils/analyticsTracker';

export default function VideoSection() {
  const analytics = useAnalytics();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Track when users interact with the YouTube video
  const handleVideoClick = () => {
    console.log('YouTube video clicked/tapped');
    
    // Track with custom analytics
    analytics.trackFeatureUsage('youtube_video', 'click');
    
    // Track with Google Analytics if window.gtag is available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'video_interaction', {
        'event_category': 'engagement',
        'event_label': 'YouTube Tutorial Video',
        'value': 1
      });
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-2 sm:px-4 mt-4 mb-8 border-t border-bg-light">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-text-primary">
        See How Memory Chess Improves Spatial Visualization
      </h2>
      
      <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8 text-sm sm:text-base">
        Watch this video to understand how practicing with Memory Chess can dramatically 
        enhance your ability to visualize and manipulate spatial information in your mind.
      </p>
      
      <div 
        className="relative w-full pb-[56.25%] overflow-hidden rounded-xl shadow-lg border border-bg-light bg-bg-card cursor-pointer" 
        onClick={handleVideoClick}
      >
        <iframe 
          ref={iframeRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-auto"
          src="https://www.youtube.com/embed/p4xFVJTyJZg" 
          title="Memory Chess: Improve Your Spatial Visualization" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen>
        </iframe>
      </div>
      
      <div className="mt-6 text-center text-text-secondary text-xs italic">
        Video: &ldquo;A New Way To Train Your Vision&rdquo; by Colin Galen
      </div>
    </div>
  );
} 