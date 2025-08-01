
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
    // This effect has a single, clear responsibility:
    // If loading is finished and there is definitively no user, redirect to login.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // The "gatekeeper" pattern:
  // 1. If we are in a loading state, show the spinner and wait.
  //    This prevents any premature rendering or redirects.
  if (loading) {
    return <Loading />;
  }

  // 2. If loading is done and we have a user, render the dashboard.
  //    This is the successful, authenticated state.
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

  // 3. If loading is done and there's still no user, the useEffect above
  //    has already started the redirect. We render the loading component
  //    to provide a seamless transition and avoid a flash of unstyled content.
  return <Loading />;
}
