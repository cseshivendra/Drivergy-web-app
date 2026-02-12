
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ComplaintFormSchema, type ComplaintFormValues } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { MessageSquareText, Loader2 } from 'lucide-react'; 
import Image from 'next/image';
import { addComplaint } from '@/lib/server-actions';
import { useAuth } from '@/context/auth-context';

// This is a client component, so we can't export metadata directly.
// However, adding a <head> tag helps with SEO for client-rendered pages.
const PageHead = () => (
    <head>
        <title>Contact Support | Drivergy Driving School</title>
        <meta name="description" content="Have an issue or feedback? Contact the Drivergy support team. We're here to help you with your driving lesson queries and platform issues." />
    </head>
);

export default function ContactPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(ComplaintFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.contact || '',
      phone: user?.phone || '',
      subject: '',
      message: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: ComplaintFormValues) {
    const success = await addComplaint(data, user?.id);
    if (success) {
      toast({
        title: "Complaint Submitted!",
        description: "Thank you for your feedback. We have logged your complaint and will get back to you soon.",
      });
      form.reset({
          name: user?.name || '',
          email: user?.contact || '',
          phone: user?.phone || '',
          subject: '',
          message: '',
      });
    } else {
      toast({
        title: "Submission Failed",
        description: "Could not log your complaint. Please try again later.",
        variant: "destructive",
      });
    }
  }

  return (
    <>
    <PageHead />
    <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="text-center p-6 bg-muted/30">
            <div className="p-3 bg-background rounded-full mb-3 w-fit mx-auto">
                <MessageSquareText className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-headline text-4xl font-bold text-primary">Contact Us</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-xl mx-auto">
                Have an issue or a suggestion? Let us know by filling out the form below.
            </p>
        </CardHeader>
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Your contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
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
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting...</> : 'Submit Complaint'}
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
