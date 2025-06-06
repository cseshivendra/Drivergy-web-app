
'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react'; 

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground md:flex-row">
        <p>&copy; {currentYear} DriveView. All rights reserved.</p>
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-center">
          <span className="font-semibold flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="5.64" y1="5.64" x2="18.36" y2="18.36" />
              <line x1="5.64" y1="18.36" x2="18.36" y2="5.64" />
            </svg>
            Made in India
          </span>
          <span className="font-semibold flex items-center gap-1.5">
            <Rocket className="h-4 w-4" /> {/* Default color */}
            Startup India
          </span>
        </div>
        <nav className="flex gap-4">
          <Link href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
