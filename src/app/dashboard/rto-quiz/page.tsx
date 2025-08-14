
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Lightbulb, ClipboardCheck } from 'lucide-react';
import { fetchQuizSets } from '@/lib/server-data';
import type { QuizSet } from '@/types';
import RtoQuizClientPage from './rto-quiz-client-page';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'RTO Mock Test Quiz | Drivergy',
    description: "Practice for your official RTO driving license exam with our free mock tests. Available in multiple languages for all learners in India."
};

export default async function AppRtoQuizPage() {
  const quizSets: QuizSet[] = await fetchQuizSets();

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader>
             <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <ClipboardCheck className="h-7 w-7 text-primary" />
                </div>
                <div>
                    <CardTitle as="h1" className="font-headline text-2xl">RTO Mock Test Quiz</CardTitle>
                    <CardDescription>Prepare for your RTO screening test. Select a set and start the quiz.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
            <RtoQuizClientPage quizSets={quizSets} />
        </CardContent>
         <CardFooter className="flex justify-center text-muted-foreground text-sm">
            <Lightbulb className="h-4 w-4 mr-2" />
            <p>Practice all sets to improve your chances of passing the RTO exam.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

