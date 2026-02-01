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
import FirebaseErrorListener from '@/components/FirebaseErrorListener';
import Script from 'next/script';

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
            {/* Google Tag Manager */}
            <Script id="google-tag-manager" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','GTM-T3DXB2PJ');
              `}
            </Script>
            {/* End Google Tag Manager */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><path fill='%23ef4444' d='M50,10c22.1,0,40,17.9,40,40S72.1,90,50,90S10,72.1,10,50S27.9,10,50,10z M50,18c-17.7,0-32,14.3-32,32s14.3,32,32,32s32-14.3,32-32S67.7,18,50,18z'/><path fill='%23ef4444' d='M50,34c-8.8,0-16,7.2-16,16s7.2,16,16,16s16-7.2,16-16S58.8,34,50,34z M50,42.8c-2.4-3.9,1.3-8.8,6.1-8.1c3.4,0.5,6.1,3.2,6.7,6.6c0.8,4.8-3.9,8.7-8.1,6.7L50,42.8z'/></svg>" />
            <title>Best Driving School India | Car Driving Lessons Near Me | Drivergy</title>
            <meta name="description" content="Drivergy is the top-rated driving school in India. Offering affordable car and motorcycle driving lessons with male & female instructors. Prepare for your RTO test and learn to drive safely. Sign up now!" />
            <meta name="keywords" content="driving school, car driving school, driving lessons, car driving lessons near me, learn to drive car, driving school in India, RTO test, two wheeler driving school, motorcycle training, female driving instructor" />
            
        </head>
        <body className="font-body antialiased">
            {/* Google Tag Manager (noscript) */}
            <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T3DXB2PJ"
            height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>
            {/* End Google Tag Manager (noscript) */}
            <AuthProvider>
                <ThemeProvider>
                    <FirebaseErrorListener />
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
                </ThemeProvider>
            </AuthProvider>
        </body>
        </html>
    );
}
