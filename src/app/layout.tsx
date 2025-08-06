
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
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><path fill=%22%2360a5fa%22 d=%22M89.6,40.6H69.2V21.3c0-4.9-3.9-8.8-8.8-8.8H39.6c-4.9,0-8.8,3.9-8.8,8.8v19.3H10.4C4.7,40.6,0,45.3,0,51v18.7c0,4,2.5,7.4,6,8.4V84c0,2.4,2,4.4,4.4,4.4h10.4c2.4,0,4.4-2,4.4-4.4v-4h40.8v4c0,2.4,2,4.4,4.4,4.4h10.4c2.4,0,4.4-2,4.4-4.4v-5.8c3.5-1,6-4.4,6-8.4V51C100,45.3,95.3,40.6,89.6,40.6z M24,79.6H15.2V73h8.8V79.6z M84.8,79.6H76V73h8.8V79.6z M90.4,59.6c-2,0-3.6-1.6-3.6-3.6s1.6-3.6,3.6-3.6s3.6,1.6,3.6,3.6S92.4,59.6,90.4,59.6z M9.6,59.6c-2,0-3.6-1.6-3.6-3.6s1.6-3.6,3.6-3.6s3.6,1.6,3.6,3.6S11.6,59.6,9.6,59.6z%22/></svg>" />
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

    