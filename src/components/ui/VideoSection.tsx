'use client';

import React from 'react';

export default function VideoSection() {
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
        <iframe 
          className="absolute top-0 left-0 w-full h-full"
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