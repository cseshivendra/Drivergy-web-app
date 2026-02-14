import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ShieldCheck, CreditCard, Shield, Award } from 'lucide-react';
import { DrivergyLogo, DrivergyLogoIcon } from '../ui/logo';
import { SOCIAL_LINKS, FOOTER_NAV_LINKS } from '@/lib/footer-data';

/**
 * Pure Render Footer component (Standardized with site-footer).
 * Ensures bit-for-bit parity between SSR and CSR.
 */
export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 text-center text-sm text-muted-foreground">
        
        {/* Brand Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
                <DrivergyLogoIcon className="h-8 w-8 text-primary shrink-0" />
                <DrivergyLogo className="h-8 w-auto text-primary" />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border"></div>
            <p className="font-headline text-lg text-muted-foreground tracking-wide">Learn. Drive. Live.</p>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-6">
            {SOCIAL_LINKS.map((link) => {
              const Icon = link.name === 'Facebook' ? Facebook : 
                           link.name === 'Twitter' ? Twitter : 
                           link.name === 'Instagram' ? Instagram : 
                           link.name === 'LinkedIn' ? Linkedin : Youtube;
              return (
                <a 
                  key={link.id} 
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{link.name}</span>
                </a>
              );
            })}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 py-8 border-y border-border/40 w-full max-w-5xl bg-muted/5 rounded-xl">
            <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div className="text-left leading-tight">
                    <p className="text-xs font-bold text-foreground uppercase tracking-tight">Secure Payments</p>
                    <p className="text-[10px] text-muted-foreground">100% Safe &amp; Encrypted</p>
                </div>
            </div>
            
            <div className="hidden md:block h-6 w-px bg-border"></div>

            <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[#6739B7]" />
                <div className="text-left leading-tight">
                    <p className="text-xs font-bold text-foreground uppercase tracking-tight">Payment Partner</p>
                    <p className="text-[10px] text-muted-foreground">Powered by <span className="font-bold text-[#6739B7]">PhonePe</span></p>
                </div>
            </div>

            <div className="hidden md:block h-6 w-px bg-border"></div>

            <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div className="text-left leading-tight">
                    <p className="text-xs font-bold text-foreground uppercase tracking-tight">Safe &amp; Secure</p>
                    <p className="text-[10px] text-muted-foreground">Verified Platform</p>
                </div>
            </div>

            <div className="hidden md:block h-6 w-px bg-border"></div>

            <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-amber-600" />
                <div className="text-left leading-tight">
                    <p className="text-xs font-bold text-foreground uppercase tracking-tight">Certified Trainers</p>
                    <p className="text-[10px] text-muted-foreground">Authorized RTO Training School</p>
                </div>
            </div>
        </div>

        {/* Identity Badges */}
         <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-2">
            <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
              <span className="font-bold" style={{ letterSpacing: '-0.5px' }}>
                  <span className="text-[#FF9933]">#startup</span><span className="text-[#000080]">i</span><span className="text-foreground">ndia</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <rect x="3" y="5" width="18" height="4" fill="#FF9933"/>
                    <rect x="3" y="9" width="18" height="4" fill="white"/>
                    <rect x="3" y="13" width="18" height="4" fill="#138808"/>
                    <circle cx="12" cy="11" r="1.5" stroke="#000080" strokeWidth="0.5" fill="none"/>
                </svg>
                <span className="font-semibold text-foreground uppercase tracking-tight text-xs">Made in India</span>
            </div>
        </div>

        {/* Copyright & Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm pt-2 border-t border-border/20 w-full">
            <p>&copy; 2025 Drivergy. All rights reserved.</p>
            {FOOTER_NAV_LINKS.map((link) => (
              <span key={link.id} className="flex items-center gap-2">
                <span className="hidden md:inline text-muted-foreground/50">|</span>
                <Link href={link.href} className="underline hover:text-primary transition-colors">
                  {link.name}
                </Link>
              </span>
            ))}
        </div>
      </div>
    </footer>
  );
}
