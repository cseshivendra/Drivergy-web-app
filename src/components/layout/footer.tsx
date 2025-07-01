'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:gap-6 order-2 sm:order-1">
              <Link href="/contact" className="hover:text-primary transition-colors">
                Get In Touch
              </Link>
              <Link href="/site/faq" className="hover:text-primary transition-colors">
                FAQ
              </Link>
            </nav>
            <div className="flex items-center gap-4 order-1 sm:order-2">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Facebook className="h-5 w-5" />
                    <span className="sr-only">Facebook</span>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                    <span className="sr-only">Twitter</span>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Instagram className="h-5 w-5" />
                    <span className="sr-only">Instagram</span>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                </a>
            </div>
        </div>
         <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
            {/* Startup India Badge */}
            <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-saffron">
                  <path d="M12.96,2.83,4.29,7.75a1,1,0,0,0-.54.88V15.37a1,1,0,0,0,.54.88l8.67,4.92a1,1,0,0,0,1.08,0l8.67-4.92a1,1,0,0,0,.54-.88V8.63a1,1,0,0,0-.54-.88L14.04,2.83A1,1,0,0,0,12.96,2.83ZM13.5,15.55a2.17,2.17,0,1,1,2.17-2.17A2.17,2.17,0,0,1,13.5,15.55Z" />
                </svg>
                <span className="font-semibold text-foreground">Startup India</span>
            </div>

            {/* Made in India Badge */}
            <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-india-blue">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                    <path d="M12 3V21M3 12H21M6.34 6.34L17.66 17.66M6.34 17.66L17.66 6.34" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <span className="font-semibold text-foreground">Made in India</span>
            </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">&copy; {new Date().getFullYear()} Drivergy. All rights reserved.</p>
      </div>
    </footer>
  );
}
