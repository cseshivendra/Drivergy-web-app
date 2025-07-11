
'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Car } from 'lucide-react';
import { cn } from "@/lib/utils";

// A simplified logo component for the footer.
const FooterLogo = () => (
    <Link href="/site" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
      <div className="p-1.5 bg-primary/10 rounded-lg transition-all duration-300">
        <Car className="h-7 w-7 text-primary shrink-0" />
      </div>
      <span className={cn(
        "font-headline text-2xl font-extrabold text-primary tracking-tighter"
      )}>
        Drivergy
      </span>
    </Link>
);


export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground">
        
        <div className="flex justify-center mb-4">
            <FooterLogo />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:gap-6 order-2 sm:order-1">
              <Link href="/contact" className="hover:text-primary transition-colors">
                Get In Touch
              </Link>
              <Link href="/site/faq" className="hover:text-primary transition-colors">
                FAQ
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Privacy Policy
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
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Youtube className="h-5 w-5" />
                    <span className="sr-only">Youtube</span>
                </a>
            </div>
        </div>
         <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
            {/* Startup India Badge */}
            <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
              <span className="font-bold" style={{ letterSpacing: '-0.5px' }}>
                  <span className="text-saffron">#startup</span><span className="text-india-blue">i</span><span className="text-foreground">ndia</span>
              </span>
            </div>

            {/* Made in India Badge */}
            <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <rect x="3" y="5" width="18" height="4" fill="#FF9933"/>
                    <rect x="3" y="9" width="18" height="4" fill="white"/>
                    <rect x="3" y="13" width="18" height="4" fill="#138808"/>
                    <circle cx="12" cy="11" r="1.5" stroke="#000080" strokeWidth="0.5" fill="none"/>
                </svg>
                <span className="font-semibold text-foreground">Made in India</span>
            </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">&copy; {new Date().getFullYear()} Drivergy. All rights reserved.</p>
      </div>
    </footer>
  );
}
