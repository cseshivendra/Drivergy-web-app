
'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import type { FaqItem } from '@/types';

const faqData: FaqItem[] = [
    {
        id: "faq1",
        question: "What documents do I need to enroll in a driving course?",
        answer: "For customer registration, you'll need a valid photo ID (like Aadhaar, PAN card, or Passport). If you already have a Learner's or Permanent License, you'll be asked to provide its details. Trainers need to provide their professional certifications and vehicle documents.",
    },
    {
        id: "faq2",
        question: "Can I choose my driving instructor?",
        answer: "Yes! Our platform allows you to specify your preference for a male or female instructor during registration. We do our best to accommodate your choice based on instructor availability in your location.",
    },
    {
        id: "faq3",
        question: "How do I book a driving lesson slot?",
        answer: "Once your registration is approved and you have an active subscription, you can log in to your customer dashboard. From there, you'll be able to view available slots for your chosen instructor and book them according to your convenience.",
    },
    {
        id: "faq4",
        question: "What types of vehicles are available for training?",
        answer: "We offer training for both two-wheelers (scooters, motorcycles) and four-wheelers (manual and automatic cars). You can select your vehicle preference during registration.",
    },
    {
        id: "faq5",
        question: "What if I need to cancel or reschedule a driving lesson?",
        answer: "You can manage your bookings through your dashboard. Please refer to our cancellation policy for details on timelines to avoid any charges. We recommend rescheduling at least 24 hours in advance.",
    },
    {
        id: "faq6",
        question: "How do I redeem a coupon code for a driving course discount?",
        answer: "You can apply a coupon or referral code on the payment page when you subscribe to a plan. Look for the 'Referral/Discount Code' field, enter your code, and click 'Apply' to see the discount on your total amount.",
    },
    {
        id: "faq7",
        question: "How can I use the points earned from referrals?",
        answer: "Referral points you earn can be used to get discounts on your subscription renewals or for other services within the Drivergy platform. Currently, points cannot be withdrawn as cash but offer great value towards your learning journey.",
    },
    {
        id: "faq8",
        question: "Is the driving school completion certificate valid at the RTO?",
        answer: "Drivergy Certificates are valid at RTO office as we are authorized partner.",
    }
];


export default function FaqPage() {
    return (
        <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
            <head>
                <title>Driving School FAQ | Drivergy</title>
                <meta name="description" content="Find answers to common questions about Drivergy's driving courses, RTO services, instructor selection, and payment options. Get all the information you need to start your driving lessons." />
            </head>
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
        </div>
    );
}
