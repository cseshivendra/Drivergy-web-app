
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
    // This effect will only run when loading is complete.
    // If, after loading, there is still no user, we redirect to login.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // The key to fixing the loop:
  // 1. If `loading` is true, ALWAYS show the Loading component and pause any other rendering.
  // 2. The layout's protection is now implicitly handled by this check. If `!user` after loading,
  //    the useEffect above will handle the redirect, but this component will just show the loading spinner,
  //    preventing a render loop here.
  if (loading) {
    return <Loading />;
  }

  // Only if loading is complete AND a user exists, render the full dashboard layout.
  // This prevents the brief "unauthenticated" state from ever rendering the children or causing a redirect flash.
  if (user) {
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

  // If loading is false and there's no user, the useEffect has already
  // started the redirect. We render the loading component to avoid a layout flash.
  return <Loading />;
}
