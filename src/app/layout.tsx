
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import type { ReactNode } from 'react';
import SiteHeader from '@/components/layout/site-header';
import SiteFooter from '@/components/layout/site-footer';
import ChatWidget from '@/components/chatbot/chat-widget';
import { usePathname } from 'next/navigation';
import NotificationToaster from '@/components/layout/notification-toaster';

// RootLayout is a client component because it uses AuthProvider and ThemeProvider
// which rely on client-side state and hooks.
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const isAppRoute = pathname.startsWith('/dashboard');

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><path fill='%23ef4444' d='M50,10c22.1,0,40,17.9,40,40S72.1,90,50,90S10,72.1,10,50S27.9,10,50,10z M50,18c-17.7,0-32,14.3-32,32s14.3,32,32,32s32-14.3,32-32S67.7,18,50,18z'/><path fill='%23ef4444' d='M50,34c-8.8,0-16,7.2-16,16s7.2,16,16,16s16-7.2,16-16S58.8,34,50,34z M50,42.8c-2.4-3.9,1.3-8.8,6.1-8.1c3.4,0.5,6.1,3.2,6.7,6.6c0.8,4.8-3.9,8.7-8.1,6.7L50,42.8z'/></svg>" />
            <title>Best Driving School India | Car Driving Lessons Near Me | Drivergy</title>
            <meta name="description" content="Drivergy is the top-rated driving school in India. Offering affordable car and motorcycle driving lessons with male & female instructors. Prepare for your RTO test and learn to drive safely. Sign up now!" />
            <meta name="keywords" content="driving school, car driving school, driving lessons, car driving lessons near me, learn to drive car, driving school in India, RTO test, two wheeler driving school, motorcycle training, female driving instructor" />
            
            {/* <!-- Google tag (gtag.js) --> */}
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-S6E5K1808K"></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-S6E5K1808K');
                `,
              }}
            />
        </head>
        <body className="font-body antialiased">
            <AuthProvider>
                <ThemeProvider>
                    {isAppRoute ? (
                        children // The dashboard layout will provide its own structure
                    ) : (
                        <div className="flex flex-col min-h-screen bg-background text-foreground">
                            <SiteHeader />
                            <main className="flex-grow">{children}</main>
                            <ChatWidget />
                            <SiteFooter />
                        </div>
                    )}
                    <Toaster />
                    <NotificationToaster />
                </ThemeProvider>
            </AuthProvider>
        </body>
        </html>
    );
}
