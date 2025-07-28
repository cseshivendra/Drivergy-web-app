
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

  // The key to fixing the loop:
  // 1. If `loading` is true, ALWAYS show the Loading component and pause any other rendering.
  // 2. The layout's protection is now implicitly handled by this check. If `!user` after loading,
  //    the login page will be the one to redirect, but this component will just show the loading spinner,
  //    preventing a render loop here.
  if (loading || !user) {
    // A useEffect is still useful to push to login page if auth state is resolved to unauthenticated.
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
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
