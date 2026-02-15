import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { DrivergyLogo, DrivergyLogoIcon } from '../ui/logo';
import { SOCIAL_LINKS, FOOTER_NAV_LINKS, TRUST_BADGES } from '@/lib/footer-data';
import { cn } from '@/lib/utils';

/**
 * Pure Render Footer component.
 * Features a high-performance smooth auto-scrolling marquee for trust badges on mobile.
 * On Desktop view, badges remain static and centered for maximum clarity.
 */
export default function SiteFooter() {
  // Deterministic styling for brand names
  const renderSublabel = (text: string) => {
    // PhonePe
    if (text.includes('PhonePe')) {
      const parts = text.split('PhonePe');
      return (
        <span>
          {parts[0]}
          <span style={{ color: '#6739B7', fontWeight: '800' }}>PhonePe</span>
          {parts[1]}
        </span>
      );
    }
    
    // Exact match for "amazon | Flipkart" layout
    if (text === 'amazon | Flipkart') {
      return (
        <span>
          <span style={{ color: '#FF9900', fontWeight: '800' }}>amazon</span>
          <span className="mx-1 text-muted-foreground/40 font-normal">|</span>
          <span style={{ color: '#2874F0', fontWeight: '800' }}>Flipkart</span>
        </span>
      );
    }

    return text;
  };

  return (
    <footer className="border-t border-border/40 bg-background py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-10">
        
        {/* Logo & Tagline */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-3">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
              <DrivergyLogoIcon className="h-8 w-8 text-primary shrink-0" />
              <DrivergyLogo className="h-8 w-auto text-primary" />
            </Link>
             <div className="hidden sm:block h-6 w-px bg-border"></div>
            <p className="font-headline text-lg text-muted-foreground tracking-wide">Learn. Drive. Live.</p>
        </div>

        {/* Social & Made in India */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-x-8 md:gap-y-6">
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

          <div className="hidden md:block h-8 w-px bg-border/60"></div>

          <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-lg border bg-card p-2 px-4 text-xs shadow-sm">
                  <span className="font-bold" style={{ letterSpacing: '-0.5px' }}>
                      <span className="text-[#FF9933]">#startup</span><span className="text-[#000080]">i</span><span className="text-foreground">ndia</span>
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

        {/* TRUST MARQUEE - Smooth Cinematic Motion on Mobile, Static on Desktop */}
        <div className="relative w-full max-w-7xl mx-auto overflow-hidden lg:overflow-visible mask-edge-fade lg:mask-none py-4 border-y border-border/40">
            <div className="flex animate-marquee lg:animate-none lg:justify-around lg:w-full">
                {/* Render badges twice for looping on mobile, but only first set on desktop */}
                {[...TRUST_BADGES, ...TRUST_BADGES].map((badge, idx) => (
                    <div 
                        key={`${badge.id}-${idx}`} 
                        className={cn(
                            "flex items-center gap-4 shrink-0 px-10 sm:px-16 lg:px-4",
                            idx >= TRUST_BADGES.length ? "flex lg:hidden" : "flex"
                        )}
                    >
                        <div 
                            className="p-3 rounded-full" 
                            style={{ backgroundColor: badge.bgColor }}
                        >
                            <badge.icon className="h-7 w-7" style={{ color: badge.color }} />
                        </div>
                        <div className="text-left leading-tight">
                            <p className="text-sm font-black text-foreground uppercase tracking-tight whitespace-nowrap">{badge.label}</p>
                            <p className="text-xs font-semibold text-muted-foreground/90 whitespace-nowrap">
                                {renderSublabel(badge.sublabel)}
                            </p>
                        </div>
                        {/* Hidden on desktop to keep the layout clean */}
                        <div className="ml-10 sm:ml-16 lg:hidden h-8 w-px bg-border/60"></div>
                    </div>
                ))}
            </div>
        </div>

        {/* Links & Copyright */}
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
