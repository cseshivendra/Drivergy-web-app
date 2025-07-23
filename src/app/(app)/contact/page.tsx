
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ComplaintFormSchema, type ComplaintFormValues } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { MessageSquareText } from 'lucide-react'; 
import Image from 'next/image';
import type { Metadata } from 'next';

// This is a client component, so we can't export metadata directly.
// However, adding a <head> tag helps with SEO for client-rendered pages.
const PageHead = () => (
    <head>
        <title>Contact Support | Drivergy</title>
        <meta name="description" content="Have an issue or feedback? Contact the Drivergy support team. We're here to help you with your driving lesson queries and platform issues." />
    </head>
);

export default function ContactPage() {
  const { toast } = useToast();

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(ComplaintFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  function onSubmit(data: ComplaintFormValues) {
    // In a real app, you'd send this data to a backend or AI flow
    console.log(data);
    toast({
      title: "Complaint Submitted!",
      description: "Thank you for your feedback. We will get back to you soon.",
    });
    form.reset(); // Reset form after submission
  }

  return (
    <>
    <PageHead />
    <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-56 w-full bg-primary/10">
            <Image
                src="https://placehold.co/800x300/E53E3E/ffffff.png"
                alt="A customer support representative ready to help"
                layout="fill"
                objectFit="cover"
                data-ai-hint="support customer service"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                <div className="p-3 bg-background/80 rounded-full mb-3 backdrop-blur-sm">
                    <MessageSquareText className="h-10 w-10 text-primary" />
                </div>
                <h1 className="font-headline text-4xl font-bold text-white drop-shadow-md">Contact Us</h1>
                <p className="mt-2 text-lg text-white/90 max-w-xl mx-auto drop-shadow-sm">
                    Have an issue or a suggestion? Let us know by filling out the form below.
                </p>
            </div>
        </div>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Regarding my recent lesson..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Complaint/Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe your issue in detail..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
