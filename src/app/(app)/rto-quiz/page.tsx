
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

// A base set of 15 questions to be used for each quiz set
const baseQuestions = [
  {
    question: `A red traffic light indicates that you must:`,
    options: ['Stop behind the line', 'Slow down', 'Proceed with caution', 'Go if the way is clear'],
    correctAnswer: 'Stop behind the line',
  },
  {
    question: `A triangular sign with a red border is a:`,
    options: ['Mandatory sign', 'Warning sign', 'Informatory sign', 'Regulatory sign'],
    correctAnswer: 'Warning sign',
  },
  {
    question: `When is overtaking prohibited?`,
    options: ['On a wide road', 'When the road ahead is not clearly visible', 'During the daytime', 'On a one-way street'],
    correctAnswer: 'When the road ahead is not clearly visible',
  },
  {
    question: `A blue circular sign with a white bicycle symbol indicates:`,
    options: ['Bicycles are not allowed', 'Parking for bicycles', 'Compulsory pedal cycle track', 'Bicycle repair shop ahead'],
    correctAnswer: 'Compulsory pedal cycle track',
  },
  {
    question: `What is the minimum age for obtaining a license for a motorcycle with gears?`,
    options: ['16 years', '18 years', '20 years', '21 years'],
    correctAnswer: '18 years',
  },
  {
    question: `What does a flashing yellow traffic light mean?`,
    options: ['Stop completely', 'Speed up', 'Slow down and proceed with caution', 'The light is about to turn red'],
    correctAnswer: 'Slow down and proceed with caution',
  },
  {
    question: `If you are approached by an ambulance with its siren on, you should:`,
    options: ['Increase your speed', 'Allow passage by moving to the left', 'Continue at the same speed', 'Stop in the middle of the road'],
    correctAnswer: 'Allow passage by moving to the left',
  },
  {
    question: `What does the sign showing a horn with a red slash across it mean?`,
    options: ['Honking is compulsory', 'You may honk softly', 'Horn prohibited', 'Hospital nearby'],
    correctAnswer: 'Horn prohibited',
  },
  {
    question: `While driving, using a mobile phone is:`,
    options: ['Allowed if using a hands-free device', 'Allowed for short calls', 'Prohibited', 'Allowed only when stopped'],
    correctAnswer: 'Prohibited',
  },
  {
    question: `The validity of a Learner's License is:`,
    options: ['3 months', '6 months', '1 year', 'Until you get a permanent license'],
    correctAnswer: '6 months',
  },
  {
    question: `When parking a vehicle facing downhill, the front wheels should be turned:`,
    options: ['Towards the right', 'Straight ahead', 'Towards the kerb or side of the road', 'It does not matter'],
    correctAnswer: 'Towards the kerb or side of the road',
  },
  {
    question: `Which of these documents must be carried while driving a vehicle?`,
    options: ['Driving license, registration, insurance, PUC', 'Aadhaar card and PAN card', 'Vehicle purchase invoice', 'Your birth certificate'],
    correctAnswer: 'Driving license, registration, insurance, PUC',
  },
  {
    question: `What does the term 'tailgating' mean in driving?`,
    options: ['Following another vehicle too closely', 'Checking your tail lights', 'Driving with the trunk open', 'Overtaking from the left'],
    correctAnswer: 'Following another vehicle too closely',
  },
  {
    question: `The hand signal for turning right is:`,
    options: ['Extend the right arm straight out, palm facing forward', 'Rotate the arm in a clockwise circle', 'Extend the right arm and move it up and down', 'Point the arm downwards'],
    correctAnswer: 'Extend the right arm straight out, palm facing forward',
  },
  {
    question: `What is the purpose of a pedestrian crossing (Zebra crossing)?`,
    options: ['For vehicles to stop', 'For pedestrians to safely cross the road', 'To mark the end of a speed limit', 'For parking'],
    correctAnswer: 'For pedestrians to safely cross the road',
  },
];

// Create mock quiz data with 10 sets, each having 15 questions
const quizSets: QuizSet[] = Array.from({ length: 10 }, (_, i) => ({
  id: `set${i + 1}`,
  title: `Set ${i + 1}`,
  questions: baseQuestions.map((q, j) => ({
    id: `q${i + 1}-${j + 1}`,
    question: `${q.question} (Set ${i + 1})`,
    options: q.options,
    correctAnswer: q.correctAnswer,
  })),
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
