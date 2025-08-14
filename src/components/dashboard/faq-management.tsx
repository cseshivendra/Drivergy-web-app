
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle, Trash2, Edit, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { FaqSchema, type FaqFormValues, type FaqItem } from '@/types';
import { addFaq, updateFaq, deleteFaq } from '@/lib/server-actions';

function FaqForm({ faq, onFormSubmit }: { faq?: FaqItem; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(FaqSchema),
    defaultValues: {
      question: faq?.question || '',
      answer: faq?.answer || '',
    },
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (data: FaqFormValues) => {
    try {
      if (faq) {
        await updateFaq(faq.id, data);
        toast({ title: "FAQ Updated", description: "The FAQ has been successfully updated." });
      } else {
        await addFaq(data);
        toast({ title: "FAQ Added", description: "The new FAQ has been successfully added." });
      }
      onFormSubmit();
      setOpen(false);
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {faq ? (
          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add FAQ</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{faq ? 'Edit' : 'Add'} FAQ</DialogTitle>
          <DialogDescription>Fill in the details for the FAQ below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="question" render={({ field }) => ( <FormItem><FormLabel>Question</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="answer" render={({ field }) => ( <FormItem><FormLabel>Answer</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem> )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {faq ? 'Save Changes' : 'Add FAQ'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function FaqManagement({ title, faqs, isLoading, onAction }: { title: ReactNode; faqs: FaqItem[]; isLoading: boolean; onAction: () => void }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FaqItem | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (faq: FaqItem) => {
    setFaqToDelete(faq);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!faqToDelete) return;
    const success = await deleteFaq(faqToDelete.id);
    if (success) {
      toast({ title: "FAQ Deleted", description: "The FAQ has been successfully removed." });
      onAction();
    } else {
      toast({ title: "Error", description: "Failed to delete the FAQ.", variant: "destructive" });
    }
    setIsAlertOpen(false);
    setFaqToDelete(null);
  };

  const renderSkeletons = () => (
    <div className="space-y-2">
      {Array(3).fill(0).map((_, i) => (
        <Skeleton key={`faq-skeleton-${i}`} className="h-14 w-full" />
      ))}
    </div>
  );

  return (
    <>
      <Card className="shadow-lg border-primary">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-2xl font-semibold flex items-center">
                    <HelpCircle className="inline-block mr-3 h-6 w-6 align-middle" />
                    {title}
                </CardTitle>
                <CardDescription>Add, edit, or remove frequently asked questions.</CardDescription>
            </div>
            <FaqForm onFormSubmit={onAction} />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            renderSkeletons()
          ) : faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map(faq => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-lg font-semibold text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex justify-between items-start p-2">
                      <p className="text-muted-foreground flex-1 pr-4">{faq.answer}</p>
                      <div className="flex items-center ml-4">
                        <FaqForm faq={faq} onFormSubmit={onAction} />
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(faq)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground h-40">
              <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-lg">No FAQs found.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the FAQ: "{faqToDelete?.question}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
