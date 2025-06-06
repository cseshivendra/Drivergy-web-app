
'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react'; 

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground md:flex-row">
        <p>&copy; {currentYear} Driverzy. All rights reserved.</p>
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-center">
          <span className="font-semibold flex items-center gap-1.5">
            <svg
              className="h-4 w-6"
              viewBox="0 0 24 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="24" height="5.33" className="fill-saffron" />
              <rect y="5.33" width="24" height="5.34" className="fill-white" />
              <rect y="10.67" width="24" height="5.33" className="fill-india-green" />
              <circle cx="12" cy="8" r="1.5" className="fill-india-blue" />
            </svg>
            Made in India
          </span>
          <span className="font-semibold flex items-center gap-1.5">
            <Rocket className="h-4 w-4" />
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
