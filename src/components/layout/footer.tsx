
'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground md:flex-row">
        <p>&copy; {currentYear} DriveView. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
