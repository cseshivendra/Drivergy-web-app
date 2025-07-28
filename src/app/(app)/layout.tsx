

'use client';

import { useAuth } from '@/context/auth-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

export default function AuthenticatedAppLayout({
                                                 children,
                                               }: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect handles redirection based on authentication state.
    // It will only run after the initial loading is complete.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // The key to fixing the loop:
  // 1. If `loading` is true, ALWAYS show the Loading component and pause any other rendering.
  // 2. If `loading` is false, THEN check if a user exists.
  // 3. If no user exists after loading, this component will trigger the redirect from the useEffect,
  //    but we still return the Loading component to prevent a flash of un-styled content.
  if (loading || !user) {
    return <Loading />;
  }

  // Only if loading is complete AND a user exists, render the full dashboard layout.
  return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen bg-background">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
            <Footer />
          </SidebarInset>
        </div>
      </SidebarProvider>
  );
}
