
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, MessageSquareText, Info, Car, Gift, ChevronDown, Send, BarChart3, BookOpen, UserPlus, User, UserCog, ClipboardCheck, Home, Library } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [referralsOpen, setReferralsOpen] = useState(false);

  const AppLogo = () => (
      <Link href="/" className="flex items-center gap-2.5 px-3 h-16 group-data-[state=collapsed]:justify-center group-data-[state=expanded]:pl-4 border-b border-sidebar-border/70 focus:outline-none focus:ring-2 focus:ring-ring rounded-t-lg">
        <div className="p-1.5 bg-primary/10 rounded-lg group-data-[state=collapsed]:rounded-full transition-all duration-300">
          <Car className="h-7 w-7 text-primary shrink-0 animate-car-slide-logo" />
        </div>
        <span className={cn(
            "font-headline text-2xl font-extrabold text-primary group-data-[state=collapsed]:hidden tracking-tighter",
            "animate-typing-drivergy" // Apply typing animation class
        )}>
        Drivergy
      </span>
      </Link>
  );

  useEffect(() => {
    if (pathname.startsWith('/create')) {
      setCreateOpen(true);
    }
    if (pathname.startsWith('/referrals')) {
      setReferralsOpen(true);
    }
  }, [pathname]);

  const isCustomer = user?.uniqueId?.startsWith('CU');
  const isTrainer = user?.uniqueId?.startsWith('TR');

  const isDashboardActive = pathname === '/' && !searchParams.get('tab');
  const isContentActive = pathname === '/' && searchParams.get('tab') === 'content';
  const isReferralsActive = pathname === '/' && searchParams.get('tab') === 'referrals';

  return (
      <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-border/60">
        <SidebarHeader className="p-0">
          <AppLogo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  isActive={isDashboardActive}
                  tooltip={{ children: "Dashboard", side: "right", align: "center" }}
              >
                <Link href="/">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {(isCustomer || isTrainer) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                      asChild
                      isActive={pathname === '/profile'}
                      tooltip={{ children: "Profile", side: "right", align: "center" }}
                  >
                    <Link href="/profile">
                      <User />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            )}

            {isCustomer && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                      onClick={() => setReferralsOpen(!referralsOpen)}
                      isActive={pathname.startsWith('/referrals')}
                      tooltip={{ children: "Referrals", side: "right", align: "center" }}
                      className="justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Gift />
                      <span>Referrals</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", referralsOpen && "rotate-180")} />
                  </SidebarMenuButton>
                  {referralsOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                              asChild
                              isActive={pathname === '/referrals/invite'}
                          >
                            <Link href="/referrals/invite">
                              <Send className="mr-2 h-4 w-4" />
                              Invite Friends
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                              asChild
                              isActive={pathname === '/referrals/track'}
                          >
                            <Link href="/referrals/track">
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Track Referrals
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  isActive={pathname === '/site'}
                  tooltip={{ children: "Home Page", side: "right", align: "center" }}
              >
                <Link href="/site">
                  <Home />
                  <span>Home Page</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {!isCustomer && !isTrainer && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={() => setCreateOpen(!createOpen)}
                        isActive={pathname.startsWith('/create')}
                        tooltip={{ children: "Create", side: "right", align: "center" }}
                        className="justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus />
                        <span>Create</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", createOpen && "rotate-180")} />
                    </SidebarMenuButton>
                    {createOpen && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                                asChild
                                isActive={pathname === '/create/trainer'}
                            >
                              <Link href="/create/trainer">
                                <UserCog className="mr-2 h-4 w-4" />
                                New Trainer
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={isContentActive}
                        tooltip={{ children: "Content Management", side: "right", align: "center" }}
                    >
                      <Link href="/?tab=content">
                        <Library />
                        <span>Content</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={isReferralsActive}
                        tooltip={{ children: "Referrals", side: "right", align: "center" }}
                    >
                      <Link href="/?tab=referrals">
                        <Gift />
                        <span>Referrals</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
            )}

            {/* Section for both Admins and Customers, but not Trainers */}
            {!isTrainer && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === '/courses'}
                        tooltip={{ children: "Courses", side: "right", align: "center" }}
                    >
                      <Link href="/courses">
                        <BookOpen />
                        <span>Courses</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === '/rto-quiz'}
                        tooltip={{ children: "RTO Quiz", side: "right", align: "center" }}
                    >
                      <Link href="/rto-quiz">
                        <ClipboardCheck />
                        <span>RTO Quiz</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  isActive={pathname === '/contact'}
                  tooltip={{ children: "Support", side: "right", align: "center" }}
              >
                <Link href="/contact">
                  <MessageSquareText />
                  <span>Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  isActive={pathname === '/about'}
                  tooltip={{ children: "About Us", side: "right", align: "center" }}
              >
                <Link href="/about">
                  <Info />
                  <span>About Us</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
  );
}
