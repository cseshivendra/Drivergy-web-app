import { Car, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Car className="h-8 w-8 text-primary" />
          <span className="font-headline text-3xl font-bold text-primary">DriveView</span>
        </Link>
        <nav className="flex items-center space-x-4">
          {/* Placeholder for future nav items
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/customers">Customers</Link>
          </Button>
          */}
          <Button variant="ghost" size="icon" aria-label="User Profile">
            <UserCircle className="h-6 w-6" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
