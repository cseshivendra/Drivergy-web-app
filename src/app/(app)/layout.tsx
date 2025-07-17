
'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading';
import { useEffect } from 'react';

export default function AuthenticatedAppLayout({
                                                   children,
                                               }: {
    children: ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If auth has finished loading and there's no user,
        // redirect to the public site homepage. This prevents unauthenticated
        // users from seeing a blank app shell.
        if (!loading && !user) {
            router.replace('/site');
        }
    }, [user, loading, router]);

    // While loading, or if we're about to redirect, show a loader.
    if (loading || !user) {
        return <Loading />;
    }

    // If we have a user, render the authenticated layout.
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
                        <Footer />
                        {/* Toaster is in RootLayout */}
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </AuthGuard>
    );
}
