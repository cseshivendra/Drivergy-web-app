
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-6 text-center text-sm text-muted-foreground">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:gap-6">
          <Link href="/contact" className="hover:text-primary transition-colors">
            Get In Touch
          </Link>
          <Link href="/site#faq" className="hover:text-primary transition-colors">
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
