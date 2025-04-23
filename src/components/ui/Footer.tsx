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
        <div className="flex justify-center mb-6">
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
        
        <div className="pt-6 text-center text-text-secondary text-sm">
          <p>&copy; {currentYear} TheMemoryChess. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 