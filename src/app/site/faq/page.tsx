
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
import { Card, CardHeader } from '@/components/ui/card';
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
                <CardHeader className="text-center p-6 space-y-2 bg-muted/30">
                    <div className="p-3 bg-background rounded-full mb-3 w-fit mx-auto">
                        <HelpCircle className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Frequently Asked Questions</h1>
                    <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Find answers to common questions about our driving courses, RTO services, and platform features.
                    </p>
                </CardHeader>
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
