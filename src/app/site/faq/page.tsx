
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Car, HelpCircle, Facebook, Twitter, Instagram, Linkedin, Youtube, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ChatWidget from '@/components/chatbot/chat-widget';
import SiteHeader from '@/components/layout/site-header';
import { fetchFaqs } from '@/lib/mock-data';
import type { FaqItem } from '@/types';

const SiteLogo = () => (
    <Link href="/site" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
      <div className="p-1.5 bg-primary/10 rounded-lg transition-all duration-300">
        <Car className="h-7 w-7 text-primary shrink-0" />
      </div>
      <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">
        Drivergy
      </span>
    </Link>
);

export default function FaqPage() {
  const [faqData, setFaqData] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFaqs().then(data => {
      setFaqData(data);
      setLoading(false);
    });
  }, []);

  const renderSkeletons = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <SiteHeader />

        <main className="flex-grow">
            <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
                <Card className="shadow-lg overflow-hidden mb-12">
                    <div className="relative h-56 w-full bg-primary/10">
                        <Image 
                            src="https://placehold.co/1200x300.png" 
                            alt="Banner for FAQ page" 
                            layout="fill" 
                            objectFit="cover"
                            data-ai-hint="question mark help"
                        />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                             <div className="p-3 bg-background/80 rounded-full mb-3 backdrop-blur-sm">
                                <HelpCircle className="h-10 w-10 text-primary" />
                            </div>
                            <h1 className="font-headline text-4xl md:text-5xl font-bold text-white drop-shadow-md">Frequently Asked Questions</h1>
                            <p className="mt-2 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-sm">
                                Find answers to common questions about our services and platform.
                            </p>
                        </div>
                    </div>
                </Card>

                {loading ? (
                    renderSkeletons()
                ) : faqData.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                    {faqData.map((faq) => (
                        <AccordionItem value={faq.id} key={faq.id} className="border-b border-border/50">
                        <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline py-4">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base pb-4">
                            <p>{faq.answer}</p>
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-16">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-lg text-muted-foreground">No FAQs available at the moment.</p>
                    </div>
                )}
            </div>
        </main>

        <footer className="border-t border-border/40 bg-background py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-4">
                <div className="flex justify-center mb-4">
                    <SiteLogo />
                </div>
                 <div className="flex justify-center items-center gap-6">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Facebook className="h-5 w-5" />
                        <span className="sr-only">Facebook</span>
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-5 w-5" />
                        <span className="sr-only">Twitter</span>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Instagram className="h-5 w-5" />
                        <span className="sr-only">Instagram</span>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="h-5 w-5" />
                        <span className="sr-only">LinkedIn</span>
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Youtube className="h-5 w-5" />
                        <span className="sr-only">Youtube</span>
                    </a>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
                    {/* Startup India Badge */}
                    <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                      <span className="font-bold" style={{ letterSpacing: '-0.5px' }}>
                          <span className="text-saffron">#startup</span><span className="text-india-blue">i</span><span className="text-foreground">ndia</span>
                      </span>
                    </div>

                    {/* Made in India Badge */}
                    <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                            <rect x="3" y="5" width="18" height="4" fill="#FF9933"/>
                            <rect x="3" y="9" width="18" height="4" fill="white"/>
                            <rect x="3" y="13" width="18" height="4" fill="#138808"/>
                            <circle cx="12" cy="11" r="1.5" stroke="#000080" strokeWidth="0.5" fill="none"/>
                        </svg>
                        <span className="font-semibold text-foreground">Made in India</span>
                    </div>
                </div>
                <p className="text-sm pt-2">
                    &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
                </p>
            </div>
        </footer>
        <ChatWidget />
    </div>
  );
}
