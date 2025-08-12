
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Car,
  Lock,
  UserPlus,
  Power,
  LayoutDashboard,
  Moon,
  Sun,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { DrivergyLogo, DrivergyLogoIcon } from '@/components/ui/logo';

const SiteLogo = () => (
  <Link
    href="/"
    className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
  >
    <div className="flex items-center gap-2.5">
        <DrivergyLogoIcon className="h-8 w-8 text-primary shrink-0" />
        <DrivergyLogo className="h-8 w-auto text-primary" />
    </div>
    <div className="hidden sm:block h-6 w-px bg-border sm:mx-2"></div>
    <p className="block font-headline text-sm sm:text-lg text-muted-foreground tracking-wide -mt-1 sm:mt-0 ml-11 sm:ml-0">Learn. Drive. Live.</p>
  </Link>
);

interface NavLink {
  href?: string;
  label: string;
  children?: NavLink[];
}

const navLinks: NavLink[] = [
  { href: '/#services', label: 'Services' },
  { href: '/#courses', label: 'Courses' },
  { href: '/#subscriptions', label: 'Plans' },
  { href: '/rto-services', label: 'RTO Services' },
  {
    label: 'Insights',
    children: [
      { href: '/faq', label: 'FAQ' },
      { href: '/#testimonials', label: 'Testimonials' },
      { href: '/blog', label: 'Blogs' },
    ],
  },
  { href: '/about', label: 'About Us' },
  { href: '/career', label: 'Careers' },
  { href: '/#contact', label: 'Support' },
];

export default function SiteHeader() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const renderDesktopAuth = () => {
    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className='flex items-center gap-2'
            >
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={user.photoURL || undefined}
                  alt={user.name || 'User'}
                />
                <AvatarFallback>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{user.name || 'User'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                My Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <Power className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <div className='flex items-center gap-2'>
        <Button asChild className={'bg-primary hover:bg-primary/90 text-primary-foreground'}>
          <Link href="/login">
            <Lock className="mr-2 h-4 w-4" />Login
          </Link>
        </Button>
        <Button asChild className={'bg-primary hover:bg-primary/90 text-primary-foreground'}>
          <Link href="/register">
            <UserPlus className="mr-2 h-4 w-4" />Register
          </Link>
        </Button>
      </div>
    );
  };

  const renderMobileAuth = () => {
    if (user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className='w-full justify-start text-lg py-6 flex items-center gap-2'>
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={user.photoURL || undefined} alt={user.name || 'User'} />
                            <AvatarFallback>{(user.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{user.name || 'User'}</span>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />My Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}><Power className="mr-2 h-4 w-4" />Log Out</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    return (
        <div className={'flex flex-col gap-4 w-full'}>
            <SheetClose asChild>
                <Link href="/login" className="w-full">
                    <Button className={'w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground'}>
                        <Lock className="mr-2 h-4 w-4" />Login
                    </Button>
                </Link>
            </SheetClose>
            <SheetClose asChild>
                <Link href="/register" className="w-full">
                    <Button className={'w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground'}>
                        <UserPlus className="mr-2 h-4 w-4" />Register
                    </Button>
                </Link>
            </SheetClose>
        </div>
    );
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <SiteLogo />

        {/* This div groups nav and auth buttons to the right */}
        <div className="hidden lg:flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1">
              {navLinks.map((link) =>
                link.children ? (
                  <DropdownMenu key={link.label}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost">
                        {link.label}
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {link.children.map((child) => (
                        <DropdownMenuItem key={child.label} asChild>
                          <Link href={child.href!}>{child.label}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="ghost" asChild key={link.label}>
                    <Link href={link.href!}>{link.label}</Link>
                  </Button>
                )
              )}
            </nav>

            {renderDesktopAuth()}

            <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            >
            {theme === 'light' ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
            </Button>
        </div>


        {/* Mobile Navigation */}
        <div className="flex items-center lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="mr-2"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw]">
              <SheetHeader>
                <SheetTitle className="sr-only">Site Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-6">
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) =>
                    link.children ? (
                      <Accordion type="single" collapsible key={link.label} className="w-full">
                        <AccordionItem value={link.label} className="border-b-0">
                          <AccordionTrigger className="flex w-full items-center justify-between py-2 text-lg font-medium text-foreground/80 hover:text-primary hover:no-underline">
                            {link.label}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col gap-4 pt-2 pl-6">
                              {link.children.map((child) => (
                                <SheetClose asChild key={child.label}>
                                  <Link
                                    href={child.href!}
                                    className="text-base font-medium text-foreground/70 hover:text-primary"
                                  >
                                    {child.label}
                                  </Link>
                                </SheetClose>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <SheetClose asChild key={link.label}>
                        <Link
                          href={link.href!}
                          className="block py-2 text-lg font-medium text-foreground/80 hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    )
                  )}
                </nav>
                <div className="border-t border-border pt-6">
                  {renderMobileAuth()}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
