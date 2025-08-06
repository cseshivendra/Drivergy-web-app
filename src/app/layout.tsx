
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import SiteHeader from '@/components/layout/site-header';
import SiteFooter from '@/components/layout/site-footer';
import ChatWidget from '@/components/chatbot/chat-widget';

// This component is a Client Component because it uses the usePathname hook.
// It contains the logic to conditionally render layouts.
function AppContent({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isAppRoute = pathname.startsWith('/dashboard');

    return (
        <>
            {isAppRoute ? (
                children // The AuthenticatedAppLayout will provide its own header/footer
            ) : (
                <div className="flex flex-col min-h-screen bg-background text-foreground">
                    <SiteHeader />
                    <main className="flex-grow">{children}</main>
                    <SiteFooter />
                    <ChatWidget />
                </div>
            )}
            <Toaster />
        </>
    );
}

// RootLayout is now a Server Component by default (no 'use client' at the top)
// but since it renders a client component that needs context, we make the whole file a client component.
// This is a common pattern.
export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚗</text></svg>" />
            <title>Best Driving School India | Car Driving Lessons Near Me | Drivergy</title>
            <meta name="description" content="Drivergy is the top-rated driving school in India. Offering affordable car and motorcycle driving lessons with male & female instructors. Prepare for your RTO test and learn to drive safely. Sign up now!" />
            <meta name="keywords" content="driving school, car driving school, driving lessons, car driving lessons near me, learn to drive car, driving school in India, RTO test, two wheeler driving school, motorcycle training, female driving instructor" />
        </head>
        <body className="font-body antialiased">
        <AuthProvider>
            <ThemeProvider>
                <AppContent>{children}</AppContent>
            </ThemeProvider>
        </AuthProvider>
        </body>
        </html>
    );
}
