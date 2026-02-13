'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import SiteHeader from '@/components/layout/site-header';
import SiteFooter from '@/components/layout/site-footer';
import ChatWidget from '@/components/chatbot/chat-widget';

export default function MainLayoutWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isAppRoute = pathname.startsWith('/dashboard');

    if (isAppRoute) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <SiteHeader />
            <main className="flex-grow">{children}</main>
            <ChatWidget />
            <SiteFooter />
        </div>
    );
}
