
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchUserById } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Share2, Twitter, Facebook, MessageSquare, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function InviteReferralsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            setLoading(true);
            fetchUserById(user.id).then(profile => {
                if (profile && profile.myReferralCode) {
                    setReferralCode(profile.myReferralCode);
                }
                setLoading(false);
            });
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const referralUrl = referralCode ? `https://drivergy.in/site/register?ref=${referralCode}` : '';

    const handleCopy = (textToCopy: string, type: 'Link' | 'Code') => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        toast({
            title: "Copied to Clipboard!",
            description: `Your referral ${type.toLowerCase()} has been copied.`,
        });
    };
    
    const getShareLink = (platform: 'twitter' | 'facebook' | 'whatsapp' | 'email') => {
        if (!referralUrl) return '#';
        const text = `Join Drivergy, the best driving school platform, using my referral link!`;
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(referralUrl);

        switch(platform) {
            case 'twitter':
                return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
            case 'facebook':
                return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
            case 'whatsapp':
                return `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
            case 'email':
                return `mailto:?subject=${encodeURIComponent('Invitation to join Drivergy')}&body=${encodedText}%0A%0A${encodedUrl}`;
        }
    }

    if (loading || authLoading) {
        return (
            <div className="container mx-auto max-w-2xl p-4 py-8 sm:p-6 lg:p-8">
                <Card className="shadow-lg">
                     <CardHeader className="text-center p-6 space-y-2">
                        <Skeleton className="h-12 w-12 mx-auto rounded-full mb-3" />
                        <Skeleton className="h-8 w-1/2 mx-auto" />
                        <Skeleton className="h-5 w-3/4 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent className="text-center space-y-6 p-6">
                        <Skeleton className="h-6 w-1/2 mx-auto" />
                        <Skeleton className="h-14 w-full max-w-sm mx-auto" />
                        <Skeleton className="h-6 w-1/3 mx-auto mt-4" />
                        <div className="flex justify-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl p-4 py-8 sm:p-6 lg:p-8">
            <Card className="shadow-xl overflow-hidden">
                <CardHeader className="text-center p-6 space-y-2 bg-muted/30">
                    <div className="p-3 bg-background rounded-full mb-3 w-fit mx-auto">
                        <Gift className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="font-headline text-3xl font-bold text-primary">Refer & Earn</h1>
                    <p className="mt-2 text-lg text-muted-foreground max-w-xl mx-auto">
                        Share your referral link with friends and earn points when they subscribe!
                    </p>
                </CardHeader>
                <CardContent className="p-6 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-muted-foreground">Share your unique referral link:</p>
                        <div className="flex justify-center items-center gap-2">
                            <Input 
                                readOnly 
                                value={referralUrl || 'Loading...'}
                                className="text-lg font-mono text-center h-14 bg-muted/50 text-primary"
                            />
                            <Button size="lg" variant="outline" onClick={() => handleCopy(referralUrl, 'Link')} disabled={!referralCode} className="h-14 w-14 p-0">
                                <Copy className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <p className="text-muted-foreground">Or share your referral code:</p>
                        <div className="flex justify-center items-center gap-2">
                            <Input 
                                readOnly 
                                value={referralCode || 'Loading...'}
                                className="text-xl font-bold tracking-widest text-center h-14 bg-muted/50 text-primary"
                            />
                            <Button size="lg" variant="outline" onClick={() => handleCopy(referralCode || '', 'Code')} disabled={!referralCode} className="h-14 w-14 p-0">
                                <Copy className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 my-4">
                        <div className="flex-grow border-t border-muted"></div>
                        <span className="text-muted-foreground text-sm font-semibold">OR</span>
                        <div className="flex-grow border-t border-muted"></div>
                    </div>

                    <p className="text-muted-foreground">Share directly on:</p>
                    <div className="flex justify-center gap-4">
                        <Button asChild size="icon" className="h-14 w-14 rounded-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90">
                            <a href={getShareLink('twitter')} target="_blank" rel="noopener noreferrer"><Twitter className="text-white h-6 w-6" /></a>
                        </Button>
                         <Button asChild size="icon" className="h-14 w-14 rounded-full bg-[#1877F2] hover:bg-[#1877F2]/90">
                            <a href={getShareLink('facebook')} target="_blank" rel="noopener noreferrer"><Facebook className="text-white h-6 w-6" /></a>
                        </Button>
                         <Button asChild size="icon" className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#25D366]/90">
                            <a href={getShareLink('whatsapp')} target="_blank" rel="noopener noreferrer"><MessageSquare className="text-white h-6 w-6" /></a>
                        </Button>
                        <Button asChild size="icon" className="h-14 w-14 rounded-full bg-gray-500 hover:bg-gray-600">
                           <a href={getShareLink('email')}><Mail className="text-white h-6 w-6" /></a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
