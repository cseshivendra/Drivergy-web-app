'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Car, HelpCircle } from 'lucide-react';

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

const faqData = [
    {
      id: "faq-1",
      question: "What documents do I need to enroll?",
      answer: "For customer registration, you'll need a valid photo ID (like Aadhaar, PAN card, or Passport). If you already have a Learner's or Permanent License, you'll be asked to provide its details. Trainers need to provide their professional certifications and vehicle documents.",
    },
    {
      id: "faq-2",
      question: "Can I choose my instructor?",
      answer: "Yes! Our platform allows you to specify your preference for a male or female instructor during registration. We do our best to accommodate your choice based on instructor availability in your location.",
    },
    {
      id: "faq-3",
      question: "How do I book a driving lesson slot?",
      answer: "Once your registration is approved and you have an active subscription, you can log in to your customer dashboard. From there, you'll be able to view available slots for your chosen instructor and book them according to your convenience.",
    },
    {
      id: "faq-4",
      question: "What types of vehicles are available for training?",
      answer: "We offer training for both two-wheelers (scooters, motorcycles) and four-wheelers (manual and automatic cars). You can select your vehicle preference during registration.",
    },
    {
      id: "faq-5",
      question: "What if I need to cancel or reschedule a lesson?",
      answer: "You can manage your bookings through your dashboard. Please refer to our cancellation policy for details on timelines to avoid any charges. We recommend rescheduling at least 24 hours in advance.",
    },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                <SiteLogo />
                <Button variant="outline" asChild>
                    <Link href="/site">Back to Site</Link>
                </Button>
            </div>
        </header>

        <main className="flex-grow">
            <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-4 rounded-full mb-4">
                        <HelpCircle className="h-12 w-12" />
                    </div>
                    <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Frequently Asked Questions</h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Find answers to common questions about our services and platform.
                    </p>
                </header>

                <Accordion type="single" collapsible className="w-full">
                  {faqData.map((faq) => (
                    <AccordionItem value={faq.id} key={faq.id} className="border-b border-border/50">
                      <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
            </div>
        </main>

        <footer className="border-t border-border/40 bg-background py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
                <div className="flex justify-center mb-4">
                    <SiteLogo />
                </div>
                <p className="text-sm">
                    &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
                </p>
            </div>
        </footer>
    </div>
  );
}
