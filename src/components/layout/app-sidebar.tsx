
'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar, // Correctly import useSidebar
} from '@/components/ui/sidebar';
import { LayoutDashboard, MessageSquareText, Info, Car } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AppSidebar() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar(); // Get sidebar state for potential dynamic rendering

  const AppLogo = () => (
    <div className="flex items-center gap-2 px-2 h-12 group-data-[state=collapsed]:justify-center group-data-[state=expanded]:pl-3">
      <Car className="h-7 w-7 text-primary shrink-0" />
      <span className="font-headline text-xl font-bold text-primary group-data-[state=collapsed]:hidden">
        DriveView
      </span>
    </div>
  );

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-border/60">
      <SidebarHeader className="p-0"> {/* Remove default padding if AppLogo handles its own */}
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
              asChild
              isActive={pathname === '/contact'}
              tooltip={{ children: "Contact Us", side: "right", align: "center" }}
            >
              <Link href="/contact">
                <MessageSquareText /> {/* Changed icon for variety */}
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
      {/* Example Footer if needed later
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{ children: "Settings", side: "right", align: "center" }}>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      */}
    </Sidebar>
  );
}
