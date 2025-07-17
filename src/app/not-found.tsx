
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22hsl(0,85%,60%)%22></rect><path d=%22M25,65 L25,50 C25,40 35,30 45,30 L55,30 C65,30 75,40 75,50 L75,65 M25,65 L75,65%22 fill=%22none%22 stroke=%22white%22 stroke-width=%2210%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/><circle cx=%2235%22 cy=%2270%22 r=%225%22 fill=%22white%22/><circle cx=%2265%22 cy=%2270%22 r=%225%22 fill=%22white%22/></svg>" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{ __html: `
          body { font-family: 'Inter', sans-serif; background-color: hsl(var(--background)); color: hsl(var(--foreground)); }
          :root {
            --background: 0 0% 98%; --foreground: 0 0% 10%; --card: 0 0% 100%;
            --primary: 0 85% 60%; --destructive: 0 84.2% 60.2%; --muted-foreground: 0 0% 40%;
          }
        ` }} />
        </head>
        <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <Card className="w-full max-w-md shadow-2xl overflow-hidden">
                <CardHeader className="bg-destructive/10">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-destructive/20 my-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="font-headline text-4xl font-extrabold text-destructive">404 - Not Found</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <p className="text-lg text-muted-foreground">
                        Oops! The page you are looking for does not exist or has been moved.
                    </p>
                    <Button asChild size="lg" className="w-full">
                        <Link href="/site">
                            <Home className="mr-2 h-5 w-5" />
                            Return to Homepage
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
        </body>
        </html>
    );
}

