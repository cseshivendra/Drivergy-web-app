
'use client';

import { Car, UserCircle, LogOut, LogIn, PanelLeft, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { toggleSidebar, state: sidebarState } = useSidebar(); 

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {isMobile ? (
            <SidebarTrigger />
          ) : (
            <Button variant="ghost" size="icon" onClick={() => toggleSidebar()} className="hidden md:flex">
               <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          {(isMobile || (!isMobile && sidebarState === 'collapsed')) && (
            <Link href="/" className="flex items-center space-x-2">
              <Car className="h-7 w-7 text-primary animate-car-slide-logo" />
              <span className={cn(
                "font-headline text-2xl font-bold text-primary",
                "animate-typing-driverzy" // Apply typing animation class
              )}>Driverzy</span>
            </Link>
          )}
        </div>
        <nav className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {authLoading ? (
             <Button variant="ghost" size="icon" aria-label="Loading user status">
                <UserCircle className="h-6 w-6 animate-pulse" />
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || 'Guest User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
