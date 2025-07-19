
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';

export const metadata: Metadata = {
    // Provides a template for page titles, e.g., "About Us | Drivergy"
    title: {
        template: '%s | Drivergy',
        default: 'Drivergy - Modern Driving School Platform',
    },
    description: 'Drivergy is a modern platform for driving education in India, connecting students with qualified instructors for car and motorcycle training, RTO assistance, and more.',
    keywords: ['driving school', 'learn to drive', 'RTO test', 'driving license', 'car training', 'motorcycle training', 'Gurugram', 'Delhi NCR'],
    authors: [{ name: 'Drivergy Team', url: 'https://drivergy.in' }],
    creator: 'Shivendra Singh',
    // Sets the base URL for resolving relative URLs in metadata
    metadataBase: new URL('https://drivergy.in'),
    // Open Graph tags for better social media sharing
    openGraph: {
        title: 'Drivergy - Modern Driving School Platform',
        description: 'The easiest way to learn driving, get your license, and become a safe driver in India.',
        url: 'https://drivergy.in',
        siteName: 'Drivergy',
        images: [
            {
                url: 'https://placehold.co/1200x630.png', // Default social sharing image
                width: 1200,
                height: 630,
                alt: 'Drivergy Logo and a scenic road',
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Drivergy - Modern Driving School Platform',
        description: 'The easiest way to learn driving, get your license, and become a safe driver in India.',
        images: ['https://placehold.co/1200x630.png'],
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22hsl(0,85%,60%)%22></rect><path d=%22M25,65 L25,50 C25,40 35,30 45,30 L55,30 C65,30 75,40 75,50 L75,65 M25,65 L75,65%22 fill=%22none%22 stroke=%22white%22 stroke-width=%2210%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/><circle cx=%2235%22 cy=%2270%22 r=%225%22 fill=%22white%22/><circle cx=%2265%22 cy=%2270%22 r=%225%22 fill=%22white%22/></svg>" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
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
