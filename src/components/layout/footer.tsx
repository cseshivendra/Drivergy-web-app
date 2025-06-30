'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center text-sm text-muted-foreground">
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
    </footer>
  );
}
