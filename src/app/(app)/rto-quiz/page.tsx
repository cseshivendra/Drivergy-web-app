
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

// Define the structure for a single question
interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

// Define the structure for a quiz set
interface QuizSet {
  id: string;
  title: string;
  questions: Question[];
}

// Create mock quiz data
const quizSets: QuizSet[] = Array.from({ length: 10 }, (_, i) => ({
  id: `set${i + 1}`,
  title: `Set ${i + 1}`,
  questions: [
    {
      id: `q${i + 1}-1`,
      question: `What does a red traffic light indicate? (Set ${i + 1})`,
      options: ['Stop', 'Go', 'Slow down', 'Proceed with caution'],
      correctAnswer: 'Stop',
    },
    {
      id: `q${i + 1}-2`,
      question: `This sign means: (Imagine a 'No Parking' sign)`,
      options: ['Parking allowed', 'No stopping', 'No parking', 'Rest area'],
      correctAnswer: 'No parking',
    },
    {
      id: `q${i + 1}-3`,
      question: 'When approaching a pedestrian crossing, what should you do?',
      options: ['Speed up', 'Honk continuously', 'Stop and let pedestrians cross', 'Ignore it'],
      correctAnswer: 'Stop and let pedestrians cross',
    },
    {
      id: `q${i + 1}-4`,
      question: `The maximum permissible speed for a car in the city is generally:`,
      options: ['80 km/h', '100 km/h', '50 km/h', '120 km/h'],
      correctAnswer: '50 km/h',
    },
  ],
}));

// A component to render a single quiz set
const QuizSetComponent = ({ quizSet }: { quizSet: QuizSet }) => {
  const { toast } = useToast();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    // Reset score when an answer is changed
    if (score !== null) {
      setScore(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let correctCount = 0;
    quizSet.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const finalScore = (correctCount / quizSet.questions.length) * 100;
    setScore(finalScore);
    toast({
      title: `${quizSet.title} Submitted!`,
      description: `You scored ${finalScore.toFixed(0)}%. ${correctCount} out of ${quizSet.questions.length} correct.`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {quizSet.questions.map((q, index) => (
        <div key={q.id} className="rounded-lg border p-4 space-y-3 shadow-sm">
          <p className="font-semibold text-foreground">
            {index + 1}. {q.question}
          </p>
          <RadioGroup
            value={selectedAnswers[q.id]}
            onValueChange={(value) => handleAnswerChange(q.id, value)}
            className="space-y-2"
          >
            {q.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                <Label htmlFor={`${q.id}-${option}`} className="cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {score !== null && (
            <div
              className={`mt-2 flex items-center text-sm p-2 rounded-md ${
                selectedAnswers[q.id] === q.correctAnswer
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              {selectedAnswers[q.id] === q.correctAnswer ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              <span>
                {selectedAnswers[q.id] === q.correctAnswer
                  ? 'Correct!'
                  : `Incorrect. The correct answer is: ${q.correctAnswer}`}
              </span>
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-end pt-4">
        <Button type="submit">Submit Answers</Button>
      </div>
    </form>
  );
};


export default function RtoQuizPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
            <ClipboardCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl font-bold">RTO Test Quiz</CardTitle>
          <CardDescription>
            Prepare for your RTO screening test. Select a set and start the quiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="set1" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
              {quizSets.map((set) => (
                <TabsTrigger key={set.id} value={set.id}>
                  {set.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {quizSets.map((set) => (
              <TabsContent key={set.id} value={set.id} className="pt-6">
                <QuizSetComponent quizSet={set} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-muted-foreground text-sm">
            <Lightbulb className="h-4 w-4 mr-2" />
            <p>Practice all sets to improve your chances of passing the RTO exam.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
