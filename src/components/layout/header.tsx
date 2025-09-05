
'use client';

import { Car, UserCircle, LogIn, PanelLeft, Sun, Moon, Power } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DrivergyLogo, DrivergyLogoIcon } from '@/components/ui/logo';
import NotificationsDropdown from './notifications-dropdown';

export default function Header() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { toggleSidebar, state: sidebarState } = useSidebar(); 

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
        </div>
        <nav className="flex items-center space-x-2">
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
            <>
              <NotificationsDropdown userId={user.id} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={signOut} aria-label="Log out">
                      <Power className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Log Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
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
