
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ShieldCheck, CreditCard, Shield, Award, Store } from 'lucide-react';
import { DrivergyLogo, DrivergyLogoIcon } from '../ui/logo';
import { SOCIAL_LINKS, FOOTER_NAV_LINKS } from '@/lib/footer-data';

/**
 * Pure Render Footer component (Standardized with site-footer).
 * Ensures bit-for-bit parity between SSR and CSR.
 * Slideable trust badges for mobile and tablet views.
 */
export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-10 px-4 sm:px-6 lg:px-8">
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

        {/* Trust Badges - SLIDEABLE ON MOBILE/TAB */}
        <div className="flex items-center justify-start lg:justify-center gap-x-4 md:gap-x-6 py-8 border-y border-border/40 w-full max-w-7xl mx-auto bg-muted/5 rounded-xl px-8 overflow-x-auto no-scrollbar flex-nowrap snap-x snap-mandatory">
            {/* Secure Payments */}
            <div className="flex items-center gap-3 shrink-0 snap-center">
                <div className="p-2.5 rounded-full bg-red-500/10">
                    <ShieldCheck className="h-7 w-7 text-red-500" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-tight">Secure Payments</p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground">100% encrypted &amp; safe</p>
                </div>
            </div>
            
            <div className="h-10 w-px bg-border shrink-0"></div>

            {/* Payment Partner */}
            <div className="flex items-center gap-3 shrink-0 snap-center">
                <div className="p-2.5 rounded-full bg-[#6739B7]/10">
                    <CreditCard className="h-7 w-7 text-[#6739B7]" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-tight">Payment Partner</p>
                    <div className="flex items-center gap-1 leading-none mt-0.5">
                        <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium">Powered by</span>
                        <span className="text-[10px] md:text-xs font-black text-[#6739B7] tracking-tight">PhonePe</span>
                    </div>
                </div>
            </div>

            <div className="h-10 w-px bg-border shrink-0"></div>

            {/* Store Partner */}
            <div className="flex items-center gap-3 shrink-0 snap-center">
                <div className="p-2.5 rounded-full bg-orange-500/10">
                    <Store className="h-7 w-7 text-orange-500" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-tight">Store Partner</p>
                    <div className="flex items-center gap-1 leading-none mt-0.5">
                        <span className="text-[10px] md:text-xs font-bold text-foreground tracking-tighter">amazon</span>
                        <span className="text-[9px] text-muted-foreground">|</span>
                        <span className="text-[10px] md:text-xs font-bold text-[#2874f0]">Flipkart</span>
                    </div>
                </div>
            </div>

            <div className="h-10 w-px bg-border shrink-0"></div>

            {/* Safe & Secure */}
            <div className="flex items-center gap-3 shrink-0 snap-center">
                <div className="p-2.5 rounded-full bg-green-500/10">
                    <Shield className="h-7 w-7 text-green-500" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-tight">Safe &amp; Secure</p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground">Verified Platform</p>
                </div>
            </div>

            <div className="h-10 w-px bg-border shrink-0"></div>

            {/* Certified Trainers */}
            <div className="flex items-center gap-3 shrink-0 snap-center">
                <div className="p-2.5 rounded-full bg-amber-500/10">
                    <Award className="h-7 w-7 text-amber-500" />
                </div>
                <div className="text-left leading-tight">
                    <p className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-tight">Certified Trainers</p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground">Authorized RTO School</p>
                </div>
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
