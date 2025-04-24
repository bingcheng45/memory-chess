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
        
        {/* Product Hunt Badge */}
        <div className="flex justify-center mb-4">
          <a 
            href="https://www.producthunt.com/posts/memory-chess?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-memory&#0045;chess" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <img 
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=957046&theme=dark&t=1745436905003" 
              alt="Memory&#0032;Chess - Train&#0032;your&#0032;spatial&#0032;visualisation&#0032;with&#0032;chess&#0033; | Product Hunt" 
              width="250" 
              height="54" 
              style={{ width: '250px', height: '54px' }}
            />
          </a>
        </div>
        
        {/* Twitter/X Icon */}
        <div className="flex justify-center mb-6">
          <a 
            href="https://x.com/TheMemoryChess" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-text-secondary hover:text-peach-500 transition-colors"
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
              className="w-5 h-5"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
            </svg>
            <span>@TheMemoryChess</span>
          </a>
        </div>
        
        <div className="pt-6 text-center text-text-secondary text-sm">
          <p>&copy; {currentYear} TheMemoryChess. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 