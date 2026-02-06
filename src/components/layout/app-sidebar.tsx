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
import { LayoutDashboard, MessageSquareText, Info, Car, Gift, ChevronDown, Send, BarChart3, BookOpen, UserPlus, User, UserCog, ClipboardCheck, Home, Library, NotebookText, Users } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { DrivergyLogo, DrivergyLogoIcon } from '@/components/ui/logo';

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [referralsOpen, setReferralsOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/dashboard/create')) {
      setCreateOpen(true);
    }
    if (pathname.startsWith('/dashboard/referrals')) {
      setReferralsOpen(true);
    }
  }, [pathname]);

  const isCustomer = user?.uniqueId?.startsWith('CU');
  const isTrainer = user?.uniqueId?.startsWith('TR');
  const isContentManager = user?.contact === 'content@drivergy.in';
  
  const isDashboardActive = pathname === '/dashboard' && !searchParams.get('tab');
  const isContentActive = (pathname === '/dashboard' && searchParams.get('tab') === 'content') || (isContentManager && pathname === '/dashboard');
  const isReferralsActive = pathname === '/dashboard' && searchParams.get('tab') === 'referrals';

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-border/60">
      <SidebarHeader className="p-0"> 
        <Link href="/dashboard" className="flex items-center gap-2.5 h-16 group-data-[state=collapsed]:justify-center group-data-[state=expanded]:pl-4 border-b border-sidebar-border/70 focus:outline-none focus:ring-2 focus:ring-ring rounded-t-lg overflow-hidden">
          <DrivergyLogoIcon className="h-8 w-8 text-primary shrink-0" />
          <div className="group-data-[state=expanded]:block hidden">
            <DrivergyLogo className="w-auto" showTagline={true} />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isDashboardActive}
              tooltip={{ children: "Dashboard", side: "right", align: "center" }}
            >
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>{isContentManager ? 'Content Admin' : 'Dashboard'}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {(isCustomer || isTrainer) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard/profile'}
                tooltip={{ children: "Profile", side: "right", align: "center" }}
              >
                <Link href="/dashboard/profile">
                  <User />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isTrainer && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard'}
                  tooltip={{ children: "My Students", side: "right", align: "center" }}
                >
                  <Link href="/dashboard">
                    <Users />
                    <span>My Students</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
          
          {isCustomer && (
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard/driving-log'}
                  tooltip={{ children: "Driving Log", side: "right", align: "center" }}
                >
                  <Link href="/dashboard/driving-log">
                    <NotebookText />
                    <span>Driving Log</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}

          {isCustomer && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setReferralsOpen(!referralsOpen)}
                  isActive={pathname.startsWith('/dashboard/referrals')}
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
                        isActive={pathname === '/dashboard/referrals/invite'}
                      >
                        <Link href="/dashboard/referrals/invite">
                          <Send className="mr-2 h-4 w-4" />
                          Invite Friends
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === '/dashboard/referrals/track'}
                      >
                        <Link href="/dashboard/referrals/track">
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
              isActive={pathname === '/'}
              tooltip={{ children: "Home Page", side: "right", align: "center" }}
            >
              <Link href="/">
                <Home />
                <span>Home Page</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {!isCustomer && !isTrainer && !isContentManager && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setCreateOpen(!createOpen)}
                  isActive={pathname.startsWith('/dashboard/create')}
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
                        isActive={pathname === '/dashboard/create/customer'}
                      >
                        <Link href="/dashboard/create/customer">
                          <User className="mr-2 h-4 w-4" />
                          New Customer
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === '/dashboard/create/trainer'}
                      >
                        <Link href="/dashboard/create/trainer">
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
                  <Link href="/dashboard?tab=content">
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
                  <Link href="/dashboard?tab=referrals">
                    <Gift />
                    <span>Referrals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}

          {isContentManager && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isContentActive}
                  tooltip={{ children: "Content Management", side: "right", align: "center" }}
                >
                  <Link href="/dashboard">
                    <Library />
                    <span>Content Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}

          {/* Section for both Admins and Customers, but not Trainers and not Content Managers */}
          {!isTrainer && !isContentManager && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard/courses'}
                  tooltip={{ children: "Courses", side: "right", align: "center" }}
                >
                  <Link href="/dashboard/courses">
                    <BookOpen />
                    <span>Courses</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard/rto-quiz'}
                  tooltip={{ children: "RTO Quiz", side: "right", align: "center" }}
                >
                  <Link href="/dashboard/rto-quiz">
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
              isActive={pathname === '/dashboard/contact'}
              tooltip={{ children: "Support", side: "right", align: "center" }}
            >
              <Link href="/dashboard/contact">
                <MessageSquareText /> 
                <span>Support</span>
              </Link>
            </SidebarMenuItem>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
