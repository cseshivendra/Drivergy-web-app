'use client';

import { useAuth } from '@/context/auth-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer'; // Import Footer
import type { ReactNode } from 'react';
<<<<<<< HEAD
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
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <Loading />;
    }

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
=======

export default function AuthenticatedAppLayout({
                                                 children,
                                               }: {
  children: ReactNode;
}) {
  return (
      <AuthGuard>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen bg-background">
            <AppSidebar />
            <SidebarInset className="flex flex-col flex-1">
              <Header />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
              <Footer /> {/* Add Footer here */}
              {/* Toaster is in RootLayout */}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AuthGuard>
  );
>>>>>>> parent of 5f6afff (Added the fixes)
}
