
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { DrivergyLogo, DrivergyLogoIcon } from '../ui/logo';
import { SOCIAL_LINKS, FOOTER_NAV_LINKS, TRUST_BADGES } from '@/lib/footer-data';

/**
 * Pure Render Footer component (Standardized with site-footer).
 * Features a high-performance smooth auto-scrolling marquee for trust badges.
 */
export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-10">
        
        {/* Brand Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-3">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
                <DrivergyLogoIcon className="h-8 w-8 text-primary shrink-0" />
                <DrivergyLogo className="h-8 w-auto text-primary" />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border"></div>
            <p className="font-headline text-lg text-muted-foreground tracking-wide">Learn. Drive. Live.</p>
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-6">
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

        {/* TRUST MARQUEE - Smooth Cinematic Motion */}
        <div className="relative w-full max-w-7xl mx-auto overflow-hidden mask-edge-fade py-4 border-y border-border/40">
            <div className="animate-marquee">
                {/* Render badges twice for seamless looping */}
                {[...TRUST_BADGES, ...TRUST_BADGES].map((badge, idx) => (
                    <div 
                        key={`${badge.id}-${idx}`} 
                        className="flex items-center gap-4 shrink-0 px-10 sm:px-16"
                    >
                        <div 
                            className="p-3 rounded-full" 
                            style={{ backgroundColor: badge.bgColor }}
                        >
                            <badge.icon className="h-7 w-7" style={{ color: badge.color }} />
                        </div>
                        <div className="text-left leading-tight">
                            <p className="text-sm font-black text-foreground uppercase tracking-tight whitespace-nowrap">{badge.label}</p>
                            <p className="text-xs font-semibold text-muted-foreground/90 whitespace-nowrap">{badge.sublabel}</p>
                        </div>
                        <div className="ml-10 sm:ml-16 h-8 w-px bg-border/60"></div>
                    </div>
                ))}
            </div>
        </div>

        {/* Copyright & Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm pt-4">
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
