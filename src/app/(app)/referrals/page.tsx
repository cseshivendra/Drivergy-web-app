
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Smartphone, Copy, Gift, Share2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function ReferralsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState('');

  const referralCode = useMemo(() => {
    if (user?.uid) {
      return `REF-${user.uid.substring(0, 6).toUpperCase()}`;
    }
    return 'REF-GUEST123'; // Fallback for guest or loading
  }, [user?.uid]);

  const referralUrl = useMemo(() => {
    return `https://driveview.example.com/signup?ref=${referralCode}`;
  }, [referralCode]);

  const referralMessage = `Hey! I'm inviting you to join DriveView, a great platform for driving instructors and students. Sign up using my referral link: ${referralUrl}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(referralUrl)
      .then(() => {
        toast({
          title: 'Copied to Clipboard!',
          description: 'Referral URL has been copied.',
        });
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
        toast({
          title: 'Error',
          description: 'Could not copy URL. Please try again.',
          variant: 'destructive',
        });
      });
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }
    console.log(`Simulating sending email to: ${email} with message: ${referralMessage}`);
    toast({
      title: 'Email Invite Sent (Simulated)',
      description: `An invitation has been "sent" to ${email}.`,
    });
    setEmail('');
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(referralMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSmsShare = () => {
    // Note: SMS functionality is highly dependent on the device and OS.
    // Desktop browsers typically cannot initiate SMS messages.
    const smsUrl = `sms:?body=${encodeURIComponent(referralMessage)}`;
    // Attempt to open, may not work on all devices/browsers
    const newWindow = window.open(smsUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
         // Fallback or notify user it might not have worked, or suggest copying the link
         toast({
            title: "SMS Sharing",
            description: "Attempted to open SMS app. If it didn't work, please copy the link manually.",
            duration: 5000,
        });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10 p-4 w-fit">
            <Gift className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl font-bold text-primary">Invite Friends & Earn Rewards</CardTitle>
          <CardDescription className="text-lg">
            Share DriveView with your friends and colleagues. Let them know about the best platform for driving education!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
            <Label htmlFor="referral-code" className="text-sm font-medium text-muted-foreground">Your Unique Referral Code</Label>
            <Input id="referral-code" value={referralCode} readOnly className="text-lg font-semibold" />
            <Label htmlFor="referral-url" className="text-sm font-medium text-muted-foreground">Your Referral URL</Label>
            <div className="flex items-center space-x-2">
              <Input id="referral-url" value={referralUrl} readOnly className="text-base" />
              <Button variant="outline" size="icon" onClick={handleCopyUrl} aria-label="Copy referral URL">
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4 inline-block"/>Email Invite</TabsTrigger>
              <TabsTrigger value="direct"><Share2 className="mr-2 h-4 w-4 inline-block"/>Direct Share</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="pt-6">
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <Label htmlFor="friend-email">Friend's Email Address</Label>
                  <Input
                    id="friend-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Mail className="mr-2 h-4 w-4" /> Send Email Invite
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="direct" className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Share your referral link directly via your favorite apps:</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Button variant="outline" onClick={handleWhatsAppShare} className="w-full">
                    <MessageSquare className="mr-2 h-5 w-5" /> Share on WhatsApp
                  </Button>
                  <Button variant="outline" onClick={handleSmsShare} className="w-full">
                    <Smartphone className="mr-2 h-5 w-5" /> Share via SMS
                  </Button>
                </div>
                <Button variant="default" onClick={handleCopyUrl} className="w-full mt-4">
                  <Copy className="mr-2 h-5 w-5" /> Copy Referral Link
                </Button>
                 <p className="text-xs text-muted-foreground text-center pt-2">
                    Note: WhatsApp and SMS sharing requires the respective apps to be installed.
                  </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
