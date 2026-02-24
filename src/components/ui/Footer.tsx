'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-10 mt-10 border-t border-bg-light">
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-6">
          <Link href="/contact-us" className="text-peach-500 hover:text-peach-400 transition-colors">
            Contact Us
          </Link>
        </div>
        
        {/* Product Hunt Badges */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.producthunt.com/products/memory-chess/launches/memory-chess?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_campaign=badge-memory-chess"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="Memory Chess - Train your spatial visualization with chess | Product Hunt"
                width="250"
                height="54"
                src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=957046&theme=dark&period=daily&t=1771899006529"
                loading="lazy"
                style={{ width: '250px', height: '54px' }}
              />
            </a>

            <a
              href="https://www.producthunt.com/products/memory-chess/launches/memory-chess?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_campaign=badge-memory-chess"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="Memory Chess - Train your spatial visualization with chess | Product Hunt"
                width="250"
                height="54"
                src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=957046&theme=dark&period=weekly&topic_id=204&t=1771899006529"
                loading="lazy"
                style={{ width: '250px', height: '54px' }}
              />
            </a>
          </div>
        </div>
        
        {/* Twitter/X Icon */}
        <div className="flex justify-center mb-6">
          <a 
            href="https://x.com/TheMemoryChess" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-peach-500 transition-colors p-2"
            aria-label="Follow us on Twitter/X"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
            </svg>
          </a>
        </div>
        
        <div className="pt-6 text-center text-text-secondary text-sm">
          <p>&copy; {currentYear} Memory Chess. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 
