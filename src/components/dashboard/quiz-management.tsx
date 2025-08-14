'use client';

import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, Edit, AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { QuizQuestionSchema, type QuizQuestionFormValues, type QuizSet, type Question, availableLanguages } from '@/types';
import { updateQuizQuestion } from '@/lib/server-actions';

// Dialog Form for editing a question
function QuestionForm({ quizSetId, question, onFormSubmit }: { quizSetId: string; question: Question; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<QuizQuestionFormValues>({
    resolver: zodResolver(QuizQuestionSchema),
    defaultValues: {
      question_en: question.question.en || '',
      question_hi: question.question.hi || '',
      options_en: (question.options.en || []).join('\n'),
      options_hi: (question.options.hi || []).join('\n'),
      correctAnswer_en: question.correctAnswer.en || '',
      correctAnswer_hi: question.correctAnswer.hi || '',
    },
  });

  const { isSubmitting } = form.formState;

  const optionsEn = form.watch('options_en').split('\n').filter(o => o.trim() !== '');
  const optionsHi = form.watch('options_hi').split('\n').filter(o => o.trim() !== '');

  const handleSubmit = async (data: QuizQuestionFormValues) => {
    try {
      await updateQuizQuestion(quizSetId, question.id, data);
      toast({ title: "Question Updated", description: "The quiz question has been successfully updated." });
      onFormSubmit();
      setOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Quiz Question</DialogTitle>
          <DialogDescription>Modify the question details for all languages below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">English</h4>
                <FormField control={form.control} name="question_en" render={({ field }) => ( <FormItem><FormLabel>Question</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="options_en" render={({ field }) => ( <FormItem><FormLabel>Options (one per line)</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="correctAnswer_en" render={({ field }) => ( <FormItem><FormLabel>Correct Answer</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger></FormControl><SelectContent>{optionsEn.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Hindi (हिंदी)</h4>
                <FormField control={form.control} name="question_hi" render={({ field }) => ( <FormItem><FormLabel>Question</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="options_hi" render={({ field }) => ( <FormItem><FormLabel>Options (one per line)</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="correctAnswer_hi" render={({ field }) => ( <FormItem><FormLabel>Correct Answer</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger></FormControl><SelectContent>{optionsHi.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
              </div>
            </div>
            <DialogFooter className="pt-4 sticky bottom-0 bg-background">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Main Quiz Management Component
export default function QuizManagement({ title, quizSets, isLoading, onAction }: { title: ReactNode; quizSets: QuizSet[]; isLoading: boolean; onAction: () => void }) {
  const renderSkeletons = () => (
    <div className="space-y-2">
      {Array(3).fill(0).map((_, i) => (
        <Skeleton key={`quiz-skeleton-${i}`} className="h-14 w-full" />
      ))}
    </div>
  );

  return (
    <Card className="shadow-lg border-primary transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-semibold flex items-center">
          <ClipboardCheck className="inline-block mr-3 h-6 w-6 align-middle" />
          {title}
        </CardTitle>
        <CardDescription>Edit questions, options, and correct answers for RTO quiz sets.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          renderSkeletons()
        ) : quizSets.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {quizSets.map(set => (
              <AccordionItem key={set.id} value={set.id}>
                <AccordionTrigger className="text-lg font-semibold">{set.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 p-2">
                    {set.questions.map((question, index) => (
                      <div key={question.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                        <p className="flex-1 text-sm text-foreground">
                          <span className="font-semibold">{index + 1}.</span> {question.question.en}
                        </p>
                        <div className="ml-4">
                          <QuestionForm quizSetId={set.id} question={question} onFormSubmit={onAction} />
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground h-40">
            <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-lg">No quiz sets found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
