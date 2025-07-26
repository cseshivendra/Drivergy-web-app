
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import type { QuizSet } from '@/types';

// A component to render a single quiz set
export default function QuizSetComponent({ quizSet, onStart, selectedLanguage }: { quizSet: QuizSet; onStart: () => void; selectedLanguage: string }) {
  const { toast } = useToast();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  const correctAnswersText = {
    en: "correct",
    hi: "सही",
  }

  const congratulationsText = {
    en: "Congratulations! You Passed",
    hi: "बधाई हो! आप पास हो गए",
  }

  const failedText = {
    en: "You Failed",
    hi: "आप फेल हो गए",
  }

  const correctAnsIsText = {
      en: "Incorrect. The correct answer is:",
      hi: "गलत। सही उत्तर है:",
  }

  useEffect(() => {
    if (!isStarted || score !== null) {
      return;
    }

    if (timeLeft <= 0) {
      handleSubmit(new Event('submit'), true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isStarted, timeLeft, score]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = (e: React.FormEvent | Event, autoSubmitted = false) => {
    if (e) e.preventDefault();
    if (score !== null) return;

    let correctCount = 0;
    quizSet.questions.forEach((q) => {
      if (selectedAnswers[q.id] === (q.correctAnswer[selectedLanguage as keyof typeof q.correctAnswer] || q.correctAnswer['en'])) {
        correctCount++;
      }
    });
    const finalScore = (correctCount / quizSet.questions.length) * 100;
    setScore(finalScore);

    if (autoSubmitted) {
      toast({
        title: "Time's Up!",
        description: `Quiz automatically submitted. You scored ${finalScore.toFixed(0)}%.`,
        variant: finalScore >= 60 ? 'default' : 'destructive',
      });
    } else if (finalScore >= 60) {
      toast({
        title: `${congratulationsText[selectedLanguage as keyof typeof congratulationsText] || congratulationsText['en']} ${quizSet.title}!`,
        description: `You scored ${finalScore.toFixed(0)}%. ${correctCount} out of ${quizSet.questions.length} ${correctAnswersText[selectedLanguage as keyof typeof correctAnswersText] || correctAnswersText['en']}.`,
      });
    } else {
      toast({
        title: `${failedText[selectedLanguage as keyof typeof failedText] || failedText['en']} ${quizSet.title}`,
        description: `You scored ${finalScore.toFixed(0)}%. Keep practicing!`,
        variant: 'destructive',
      });
    }
  };
  
  const handleStart = () => {
    onStart(); // This will trigger the auth check
    setIsStarted(true);
    setTimeLeft(30 * 60);
    setSelectedAnswers({});
    setScore(null);
  };

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg shadow-sm bg-muted/50">
        <h3 className="text-xl font-semibold mb-2 text-foreground">Ready for the {quizSet.title} challenge?</h3>
        <p className="text-muted-foreground mb-4">You will have 30 minutes to complete 15 questions.</p>
        <Button size="lg" onClick={handleStart}>
          Start Test
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-between items-center p-3 border rounded-lg bg-card shadow-sm">
        <h3 className="text-lg font-semibold text-primary">{quizSet.title} in Progress</h3>
        <div className={`flex items-center font-bold text-lg ${timeLeft < 60 ? 'text-destructive' : 'text-foreground'}`}>
          <Clock className="mr-2 h-5 w-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {quizSet.questions.map((q, index) => (
        <div key={q.id} className="rounded-lg border p-4 space-y-3 shadow-sm bg-card">
          <p className="font-semibold text-foreground">
            {index + 1}. {q.question[selectedLanguage as keyof typeof q.question] || q.question['en']}
          </p>
          <RadioGroup
            value={selectedAnswers[q.id]}
            onValueChange={(value) => handleAnswerChange(q.id, value)}
            className="space-y-2"
            disabled={score !== null}
          >
            {(q.options[selectedLanguage as keyof typeof q.options] || q.options['en']).map((option, idx) => (
              <div key={`${q.id}-opt-${idx}`} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${q.id}-${idx}`} />
                <Label htmlFor={`${q.id}-${idx}`} className="cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {score !== null && (
            <div
              className={`mt-2 flex items-center text-sm p-2 rounded-md ${
                selectedAnswers[q.id] === (q.correctAnswer[selectedLanguage as keyof typeof q.correctAnswer] || q.correctAnswer['en'])
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              {selectedAnswers[q.id] === (q.correctAnswer[selectedLanguage as keyof typeof q.correctAnswer] || q.correctAnswer['en']) ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              <span>
                {selectedAnswers[q.id] === (q.correctAnswer[selectedLanguage as keyof typeof q.correctAnswer] || q.correctAnswer['en'])
                  ? 'Correct!'
                  : `${correctAnsIsText[selectedLanguage as keyof typeof correctAnsIsText] || correctAnsIsText['en']} ${q.correctAnswer[selectedLanguage as keyof typeof q.correctAnswer] || q.correctAnswer['en']}`}
              </span>
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-end items-center pt-4 border-t mt-8">
        {score !== null ? (
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full justify-between">
            <p className={`text-xl font-bold ${score >= 60 ? 'text-green-600' : 'text-destructive'}`}>
              Your Score: {score.toFixed(0)}%
            </p>
            <Button type="button" variant="outline" onClick={handleStart}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
          </div>
        ) : (
          <Button type="submit">Submit Answers</Button>
        )}
      </div>
    </form>
  )
};

    