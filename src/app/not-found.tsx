
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';
import Image from 'next/image';

export default function NotFound() {
    return (
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
    );
}
