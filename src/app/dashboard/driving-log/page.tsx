
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { NotebookText, Send, Lightbulb, ThumbsUp, Wrench, Loader2, Sparkles } from 'lucide-react';
import { analyzeDrivingSession, DrivingAnalysisInputSchema, type DrivingAnalysisInput, type DrivingAnalysisOutput } from '@/ai/flows/driving-feedback-flow';

export default function DrivingLogPage() {
    const { toast } = useToast();
    const [feedback, setFeedback] = useState<DrivingAnalysisOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<DrivingAnalysisInput>({
        resolver: zodResolver(DrivingAnalysisInputSchema),
        defaultValues: {
            sessionDescription: '',
        },
    });

    const onSubmit = async (data: DrivingAnalysisInput) => {
        setIsLoading(true);
        setFeedback(null);
        try {
            const result = await analyzeDrivingSession(data);
            setFeedback(result);
        } catch (error) {
            console.error("Driving analysis error:", error);
            toast({
                title: "Analysis Failed",
                description: "There was an error getting feedback for your session. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8">
            <Card className="shadow-xl overflow-hidden">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <NotebookText className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <CardTitle as="h1" className="font-headline text-2xl">AI Driving Log</CardTitle>
                            <CardDescription>Describe your practice session and get instant, personalized feedback.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="sessionDescription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg">How did your driving session go?</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                rows={6}
                                                placeholder="e.g., I practiced for 30 minutes in my neighborhood. I did well with turning, but I struggled with parallel parking and got a bit nervous in traffic..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                                    ) : (
                                        <><Sparkles className="mr-2 h-4 w-4" />Get Feedback</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {isLoading && (
                 <Card className="mt-8 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Analyzing Your Session...</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                            <ThumbsUp className="h-6 w-6 text-green-500 mt-1" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/4" />
                                <div className="h-4 bg-muted rounded w-full" />
                                <div className="h-4 bg-muted rounded w-3/4" />
                            </div>
                        </div>
                         <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                            <Wrench className="h-6 w-6 text-blue-500 mt-1" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/4" />
                                <div className="h-4 bg-muted rounded w-full" />
                                <div className="h-4 bg-muted rounded w-3/4" />
                            </div>
                        </div>
                         <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                            <Lightbulb className="h-6 w-6 text-yellow-500 mt-1" />
                             <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/4" />
                                <div className="h-4 bg-muted rounded w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {feedback && (
                <Card className="mt-8 shadow-lg animate-fade-in-up">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Your AI Feedback</CardTitle>
                        <CardDescription>Here is an analysis of your driving session.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border-l-4 border-green-500 bg-green-500/10 rounded-r-lg">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><ThumbsUp className="h-5 w-5 text-green-600" />What Went Well</h3>
                            <p className="text-foreground/90">{feedback.positiveReinforcement}</p>
                        </div>

                        <div className="p-4 border-l-4 border-blue-500 bg-blue-500/10 rounded-r-lg">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Wrench className="h-5 w-5 text-blue-600" />Constructive Tips</h3>
                            <p className="text-foreground/90">{feedback.constructiveTips}</p>
                        </div>
                        
                        <div className="p-4 border-l-4 border-yellow-500 bg-yellow-500/10 rounded-r-lg">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Lightbulb className="h-5 w-5 text-yellow-600" />Safety Reminder</h3>
                            <p className="text-foreground/90">{feedback.safetyReminder}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
