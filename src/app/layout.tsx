'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';

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
        <title>Drivergy - Learn Driving for Just ₹999 | Sign-up Now | Flexible Time | Male & Female Instructors</title>
        <meta name="description" content="Join Drivergy and learn to drive for only ₹999! We offer flexible scheduling with expert male and female instructors. Sign up today for the best driving lessons in India." />
        <meta name="keywords" content="driving school, learn to drive, driving lessons, car training, motorcycle training, driving school for women, driving school for men, cheap driving lessons, flexible driving school, RTO test" />
      </head>
      <body className="font-body antialiased">
          <AuthProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
      </body>
    </html>
  );
}
