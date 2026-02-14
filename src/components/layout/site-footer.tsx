'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ShieldCheck, CreditCard, Shield, Award } from 'lucide-react';
import { DrivergyLogo, DrivergyLogoIcon } from '../ui/logo';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-8">
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-3">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
              <DrivergyLogoIcon className="h-8 w-8 text-primary shrink-0" />
              <DrivergyLogo className="h-8 w-auto text-primary" />
            </Link>
             <div className="hidden sm:block h-6 w-px bg-border"></div>
            <p className="font-headline text-lg text-muted-foreground tracking-wide">Learn. Drive. Live.</p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6">
          {/* Social Media Icons */}
          <div className="flex justify-center items-center gap-6">
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

          <div className="hidden md:block h-8 w-px bg-border/60"></div>

          {/* Country/Brand Badges */}
          <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-lg border bg-card p-2 px-4 text-xs shadow-sm">
                  <span className="font-bold" style={{ letterSpacing: '-0.5px' }}>
                      <span className="text-saffron">#startup</span><span className="text-india-blue">i</span><span className="text-foreground">ndia</span>
                  </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border bg-card p-2 px-4 text-xs shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0">
                      <rect x="3" y="5" width="18" height="4" fill="#FF9933" />
                      <rect x="3" y="9" width="18" height="4" fill="white" />
                      <rect x="3" y="13" width="18" height="4" fill="#138808" />
                      <circle cx="12" cy="11" r="1.5" stroke="#000080" strokeWidth="0.5" fill="none" />
                  </svg>
                  <span className="font-semibold text-foreground whitespace-nowrap uppercase tracking-tight">Made in India</span>
              </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-10 py-10 border-y border-border/40 max-w-6xl mx-auto bg-muted/5 rounded-xl px-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-full">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-sm font-bold text-foreground uppercase tracking-tight">Secure Payments</p>
                    <p className="text-xs text-muted-foreground">100% encrypted &amp; safe</p>
                </div>
            </div>
            
            <div className="hidden lg:block h-10 w-px bg-border"></div>

            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#6739B7]/10 rounded-full">
                    <CreditCard className="h-6 w-6 text-[#6739B7]" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-sm font-bold text-foreground uppercase tracking-tight">Payment Partner</p>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground font-medium">Powered by</span>
                        <span className="text-sm font-black text-[#6739B7] tracking-tight">PhonePe</span>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block h-10 w-px bg-border"></div>

            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/10 rounded-full">
                    <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-sm font-bold text-foreground uppercase tracking-tight">Safe &amp; Secure</p>
                    <p className="text-xs text-muted-foreground">Verified Platform</p>
                </div>
            </div>

            <div className="hidden lg:block h-10 w-px bg-border"></div>

            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-full">
                    <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-sm font-bold text-foreground uppercase tracking-tight">Certified Trainers</p>
                    <p className="text-xs text-muted-foreground">Authorized RTO Training School</p>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm pt-2">
            <p>&copy; {new Date().getFullYear()} Drivergy. All rights reserved.</p>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/blog" className="underline hover:text-primary transition-colors">Blog</Link>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/faq" className="underline hover:text-primary transition-colors">FAQ</Link>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/privacy-policy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/terms-and-conditions" className="underline hover:text-primary transition-colors">Terms &amp; Conditions</Link>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <Link href="/refund-policy" className="underline hover:text-primary transition-colors">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
