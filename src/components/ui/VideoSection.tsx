'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useAnalytics } from '@/lib/utils/analyticsTracker';

export default function VideoSection() {
  const analytics = useAnalytics();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [videoStarted, setVideoStarted] = useState(false);
  const [trackedProgress, setTrackedProgress] = useState<{[key: number]: boolean}>({
    25: false,
    50: false,
    75: false,
    90: false
  });
  
  // Monitor YouTube player events via postMessage
  useEffect(() => {
    // Variables to track player state
    let currentPlayerState = -1;
    let videoLength = 0;
    let progressCheckInterval: NodeJS.Timeout | null = null;
    
    // Handler for messages from YouTube iframe
    const handleYouTubeMessage = (event: MessageEvent) => {
      // Only process messages from YouTube
      if (event.origin !== "https://www.youtube.com") return;
      
      try {
        // YouTube messages are stringified JSON (sometimes)
        const data = typeof event.data === 'string' && event.data.startsWith('{')
          ? JSON.parse(event.data)
          : event.data;
          
        // Check for YouTube player events
        if (data.event === 'onStateChange') {
          const playerState = data.info;
          
          // Update current state for internal tracking
          currentPlayerState = playerState;
          
          // Handle video start (state 1 = playing)
          if (playerState === 1 && !videoStarted) {
            console.log('Video started for the first time');
            setVideoStarted(true);
            
            // Send start event
            analytics.trackFeatureUsage('youtube_video', 'start');
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'video_start', {
                'event_category': 'engagement',
                'event_label': 'YouTube Tutorial Video',
                'video_title': 'Memory Chess Tutorial',
                'video_provider': 'YouTube',
                'video_url': 'https://www.youtube.com/watch?v=p4xFVJTyJZg'
              });
            }
            
            // Start progress tracking
            startProgressTracking();
          }
          // Handle video resumed (state 1 = playing)
          else if (playerState === 1 && videoStarted) {
            console.log('Video resumed playing');
            
            analytics.trackFeatureUsage('youtube_video', 'resume');
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'video_play', {
                'event_category': 'engagement',
                'event_label': 'YouTube Tutorial Video',
                'video_title': 'Memory Chess Tutorial',
                'video_provider': 'YouTube',
                'video_url': 'https://www.youtube.com/watch?v=p4xFVJTyJZg'
              });
            }
          }
          // Handle pause (state 2 = paused)
          else if (playerState === 2 && videoStarted) {
            getVideoTime().then(({ currentTime, duration }) => {
              // Only track meaningful pauses (not at the start or end)
              if (currentTime > 2 && currentTime < (duration - 2)) {
                console.log('Video paused at:', currentTime);
                
                analytics.trackFeatureUsage('youtube_video', 'pause', Math.round(currentTime));
                if (typeof window !== 'undefined' && window.gtag) {
                  window.gtag('event', 'video_pause', {
                    'event_category': 'engagement',
                    'event_label': 'YouTube Tutorial Video',
                    'video_title': 'Memory Chess Tutorial',
                    'video_provider': 'YouTube',
                    'video_url': 'https://www.youtube.com/watch?v=p4xFVJTyJZg',
                    'time_position': Math.round(currentTime)
                  });
                }
              }
            });
          }
          // Handle video ended (state 0 = ended)
          else if (playerState === 0 && videoStarted) {
            console.log('Video completed');
            
            analytics.trackFeatureUsage('youtube_video', 'complete');
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'video_complete', {
                'event_category': 'engagement',
                'event_label': 'YouTube Tutorial Video',
                'video_title': 'Memory Chess Tutorial',
                'video_provider': 'YouTube',
                'video_url': 'https://www.youtube.com/watch?v=p4xFVJTyJZg'
              });
            }
            
            // Stop progress tracking
            if (progressCheckInterval) {
              clearInterval(progressCheckInterval);
              progressCheckInterval = null;
            }
          }
        }
        // Store video duration when available
        else if (data.event === 'infoDelivery' && data.info && data.info.duration) {
          videoLength = data.info.duration;
        }
      } catch {
        // Silently ignore parsing errors
      }
    };
    
    // Function to get current video time using postMessage
    const getVideoTime = (): Promise<{currentTime: number, duration: number}> => {
      return new Promise((resolve) => {
        // Create a unique ID for this request
        const requestId = Date.now().toString();
        
        // Create a one-time event listener for the response
        const handleTimeResponse = (event: MessageEvent) => {
          if (event.origin !== "https://www.youtube.com") return;
          
          try {
            const data = typeof event.data === 'string' && event.data.startsWith('{')
              ? JSON.parse(event.data)
              : event.data;
            
            // Check if this is our response
            if (data.id === requestId && data.event === 'infoDelivery' && data.info) {
              // Remove this listener once we got our response
              window.removeEventListener('message', handleTimeResponse);
              resolve({
                currentTime: data.info.currentTime || 0,
                duration: data.info.duration || videoLength || 0
              });
            }
          } catch {
            // Just ignore parsing errors
          }
        };
        
        // Listen for the response
        window.addEventListener('message', handleTimeResponse);
        
        // Send the getCurrentTime command
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'getPlayerState,getCurrentTime,getDuration',
              args: [],
              id: requestId
            }), 
            'https://www.youtube.com'
          );
        }
        
        // Set a timeout in case we don't get a response
        setTimeout(() => {
          window.removeEventListener('message', handleTimeResponse);
          resolve({ currentTime: 0, duration: videoLength || 0 });
        }, 500);
      });
    };
    
    // Function to check video progress for milestone tracking
    const checkProgress = async () => {
      if (currentPlayerState !== 1) return; // Only check when playing
      
      try {
        const { currentTime, duration } = await getVideoTime();
        if (duration <= 0) return;
        
        const percentComplete = Math.floor((currentTime / duration) * 100);
        
        // Track milestones
        const milestones = [25, 50, 75, 90];
        milestones.forEach(milestone => {
          if (percentComplete >= milestone && !trackedProgress[milestone]) {
            // Track this milestone
            setTrackedProgress(prev => ({...prev, [milestone]: true}));
            
            console.log(`Video reached ${milestone}% milestone`);
            analytics.trackFeatureUsage('youtube_video', 'progress', milestone);
            
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'video_progress', {
                'event_category': 'engagement',
                'event_label': 'YouTube Tutorial Video',
                'video_title': 'Memory Chess Tutorial',
                'video_provider': 'YouTube',
                'video_url': 'https://www.youtube.com/watch?v=p4xFVJTyJZg',
                'percent_complete': milestone
              });
            }
          }
        });
      } catch (error) {
        console.error('Error checking video progress:', error);
      }
    };
    
    // Start tracking progress
    const startProgressTracking = () => {
      if (!progressCheckInterval) {
        progressCheckInterval = setInterval(checkProgress, 2000);
      }
    };
    
    // Set up event listener for YouTube messages
    window.addEventListener('message', handleYouTubeMessage);
    
    // Clean up
    return () => {
      window.removeEventListener('message', handleYouTubeMessage);
      if (progressCheckInterval) {
        clearInterval(progressCheckInterval);
      }
    };
  }, [videoStarted, trackedProgress, analytics]);
  
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-2 sm:px-4 mt-4 mb-8 border-t border-bg-light">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-text-primary">
        See How Memory Chess Improves Spatial Visualization
      </h2>
      
      <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8 text-sm sm:text-base">
        Watch this video to understand how practicing with Memory Chess can dramatically 
        enhance your ability to visualize and manipulate spatial information in your mind.
      </p>
      
      <div className="relative w-full pb-[56.25%] overflow-hidden rounded-xl shadow-lg border border-bg-light bg-bg-card">
        {/* Use direct iframe with enablejsapi instead of YouTube API */}
        <iframe
          ref={iframeRef}
          className="absolute top-0 left-0 w-full h-full"
          src="https://www.youtube.com/embed/p4xFVJTyJZg?enablejsapi=1&origin=https://thememorychess.com&playsinline=1&modestbranding=1&rel=0&controls=1"
          title="Memory Chess: Improve Your Spatial Visualization"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>
      
      <div className="mt-6 text-center text-text-secondary text-xs italic">
        Video: &ldquo;A New Way To Train Your Vision&rdquo; by Colin Galen
      </div>
    </div>
  );
} 