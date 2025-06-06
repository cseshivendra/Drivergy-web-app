
'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import type { ReactNode } from 'react';

export default function AuthenticatedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 overflow-y-auto">
             {children}
            </main>
            {/* Toaster is in RootLayout */}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
