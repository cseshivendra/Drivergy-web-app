
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/layout/header'; // Keep Header for main content area

export const metadata: Metadata = {
  title: 'DriveView',
  description: 'Admin Dashboard for Driving School',
};

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
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <SidebarProvider>
            <div className="flex min-h-screen bg-background">
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1">
                <Header />
                <main className="flex-1 overflow-y-auto">
                 {children}
                </main>
                <Toaster />
              </SidebarInset>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
