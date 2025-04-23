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
        
        <div className="pt-6 text-center text-text-secondary text-sm">
          <p>&copy; {currentYear} TheMemoryChess. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 