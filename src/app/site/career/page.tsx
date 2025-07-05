
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Briefcase, User, Mail, Phone, FileUp, Linkedin, Twitter, Facebook, Instagram, Youtube, CheckCircle } from 'lucide-react';
import SiteHeader from '@/components/layout/site-header';
import ChatWidget from '@/components/chatbot/chat-widget';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { CareerFormSchema, type CareerFormValues, JobOpenings } from '@/types';


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

export default function CareerPage() {
    const { toast } = useToast();
    const form = useForm<CareerFormValues>({
        resolver: zodResolver(CareerFormSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            position: '',
            resume: undefined,
            coverLetter: '',
        },
    });

    function onSubmit(data: CareerFormValues) {
        console.log('Career Application Data:', data);
        toast({
            title: "Application Submitted!",
            description: "Thank you for your interest. We will review your application and get back to you soon.",
        });
        form.reset();
    }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <SiteHeader />

        <main className="flex-grow">
            <div className="container mx-auto max-w-6xl p-4 py-8 sm:p-6 lg:p-8">
                <Card className="shadow-lg overflow-hidden mb-12">
                    <div className="relative h-56 w-full bg-primary/10">
                        <Image 
                            src="https://placehold.co/1200x300/3b82f6/ffffff.png" 
                            alt="Banner for career page" 
                            layout="fill" 
                            objectFit="cover"
                            data-ai-hint="office team meeting"
                        />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                             <div className="p-3 bg-background/80 rounded-full mb-3 backdrop-blur-sm">
                                <Briefcase className="h-10 w-10 text-primary" />
                            </div>
                            <h1 className="font-headline text-4xl md:text-5xl font-bold text-white drop-shadow-md">Join Our Team</h1>
                            <p className="mt-2 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-sm">
                                Be a part of a team that's revolutionizing driving education in India.
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Job Listings */}
                    <div className="lg:col-span-2">
                        <h2 className="font-headline text-3xl font-bold text-primary mb-6">Current Openings</h2>
                        {JobOpenings.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {JobOpenings.map((job) => (
                                    <AccordionItem value={job.id} key={job.id} className="border rounded-lg shadow-sm data-[state=open]:shadow-md">
                                    <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline p-4">
                                        <div className="flex-1">
                                            <p className="text-primary">{job.title}</p>
                                            <p className="text-sm font-normal text-muted-foreground">{job.location} &bull; {job.type}</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-base px-4 pb-4">
                                        <p className="mb-4">{job.description}</p>
                                        <h4 className="font-semibold text-foreground mb-2">Requirements:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {job.requirements.map((req, i) => (
                                                <li key={i}>{req}</li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                             <Card>
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    <p>There are no open positions at the moment. Please check back later or submit a general application.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    {/* Right Column: Application Form */}
                    <div className="lg:col-span-1">
                         <Card className="shadow-lg sticky top-24">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl font-bold">Apply Now</CardTitle>
                                <CardDescription>Interested in joining us? Fill out the form below.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" />Full Name</FormLabel>
                                                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4" />Email</FormLabel>
                                                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" />Phone</FormLabel>
                                                    <FormControl><Input type="tel" placeholder="Your contact number" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="position"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4" />Position Applying For</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a position" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {JobOpenings.map(job => (
                                                                <SelectItem key={job.id} value={job.title}>{job.title}</SelectItem>
                                                            ))}
                                                            <SelectItem value="General Application">General Application</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="resume"
                                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                                <FormItem>
                                                <FormLabel className="flex items-center"><FileUp className="mr-2 h-4 w-4" />Upload Resume/CV</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                    type="file" 
                                                    {...fieldProps} 
                                                    onChange={(event) => onChange(event.target.files)}
                                                    accept=".pdf,.doc,.docx"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="coverLetter"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center">Cover Letter (Optional)</FormLabel>
                                                    <FormControl><Textarea placeholder="Tell us why you're a good fit..." {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? 'Submitting...' : 'Submit Application'}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
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
                <p className="text-sm pt-2">
                    &copy; {new Date().getFullYear()} Drivergy. All rights reserved. <Link href="#" className="underline hover:text-primary">Privacy Policy</Link>.
                </p>
            </div>
        </footer>
        <ChatWidget />
    </div>
  );
}
