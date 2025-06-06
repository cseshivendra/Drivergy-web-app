
'use client';

import Link from 'next/link';
import { useState } from 'react';
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
import { LayoutDashboard, MessageSquareText, Info, Car, Gift, ChevronDown, Send, BarChart3 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AppSidebar() {
  const pathname = usePathname();
  const [referralsOpen, setReferralsOpen] = useState(pathname.startsWith('/referrals'));

  const AppLogo = () => (
    <div className="flex items-center gap-2.5 px-3 h-16 group-data-[state=collapsed]:justify-center group-data-[state=expanded]:pl-4 border-b border-sidebar-border/70">
      <div className="p-1.5 bg-primary/10 rounded-lg group-data-[state=collapsed]:rounded-full transition-all duration-300">
        <Car className="h-7 w-7 text-primary shrink-0" />
      </div>
      <span className="font-headline text-2xl font-extrabold text-primary group-data-[state=collapsed]:hidden tracking-tighter">
        DriveView
      </span>
    </div>
  );

  // Effect to open referrals submenu if a child route is active on initial load or route change
  useState(() => {
    if (pathname.startsWith('/referrals')) {
      setReferralsOpen(true);
    }
  });


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
              isActive={pathname === '/'}
              tooltip={{ children: "Dashboard", side: "right", align: "center" }}
            >
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
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

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/contact'}
              tooltip={{ children: "Contact Us", side: "right", align: "center" }}
            >
              <Link href="/contact">
                <MessageSquareText /> 
                <span>Contact Us</span>
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
