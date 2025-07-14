
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { listenToFaqs } from '@/lib/mock-data';
import type { FaqItem } from '@/types';


export default function FaqPage() {
  const [faqData, setFaqData] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToFaqs(data => {
      setFaqData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderSkeletons = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
        <Card className="shadow-lg overflow-hidden mb-12">
            <div className="relative h-56 w-full bg-primary/10">
                <Image 
                    src="https://placehold.co/1200x300/f97316/ffffff.png" 
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
  );
}
