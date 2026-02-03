'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { DrivergyLogo, DrivergyLogoIcon } from '../ui/logo';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2 mb-4">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
              <DrivergyLogoIcon className="h-8 w-8 text-primary shrink-0" />
              <DrivergyLogo className="h-8 w-auto text-primary" />
            </Link>
             <div className="hidden sm:block h-6 w-px bg-border"></div>
            <p className="font-headline text-lg text-muted-foreground tracking-wide">Learn. Drive. Live.</p>
        </div>

        <div className="flex justify-center items-center gap-6">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Facebook className="h-5 w-5" />
            <span className="sr-only">Facebook</span>
          </a>
          <a href="https://x.com/DIndia720" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Twitter className="h-5 w-5" />
            <span className="sr-only">Twitter</span>
          </a>
          <a href="https://www.instagram.com/drivergyofficial/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Instagram className="h-5 w-5" />
            <span className="sr-only">Instagram</span>
          </a>
          <a href="https://www.linkedin.com/company/drivergy" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Linkedin className="h-5 w-5" />
            <span className="sr-only">LinkedIn</span>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Youtube className="h-5 w-5" />
            <span className="sr-only">Youtube</span>
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
          <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
            <span className="font-bold" style={{ letterSpacing: '-0.5px' }}>
              <span className="text-saffron">#startup</span><span className="text-india-blue">i</span><span className="text-foreground">ndia</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
              <rect x="3" y="5" width="18" height="4" fill="#FF9933" />
              <rect x="3" y="9" width="18" height="4" fill="white" />
              <rect x="3" y="13" width="18" height="4" fill="#138808" />
              <circle cx="12" cy="11" r="1.5" stroke="#000080" strokeWidth="0.5" fill="none" />
            </svg>
            <span className="font-semibold text-foreground">Made in India</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm pt-2">
            <p>&copy; {new Date().getFullYear()} Drivergy. All rights reserved.</p>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/blog" className="underline hover:text-primary">Blog</Link>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/faq" className="underline hover:text-primary">FAQ</Link>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/terms-and-conditions" className="underline hover:text-primary">Terms & Conditions</Link>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/refund-policy" className="underline hover:text-primary">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
