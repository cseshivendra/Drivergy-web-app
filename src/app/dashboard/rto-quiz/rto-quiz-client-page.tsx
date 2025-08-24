
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
import { CheckCircle, XCircle, Clock, RefreshCw, User, LogIn, Globe } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { availableLanguages } from '@/types';
import type { QuizSet } from '@/types';
import QuizSetComponent from './quiz-set-component';

export default function RtoQuizClientPage({ quizSets }: { quizSets: QuizSet[] }) {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    const handleStartAttempt = () => {
        if (!user) {
            router.push('/login');
        }
    };
    
    const sortedQuizSets = [...quizSets].sort((a, b) => {
        const numA = parseInt(a.title.replace('Set ', ''), 10);
        const numB = parseInt(b.title.replace('Set ', ''), 10);
        return numA - numB;
    });

    return (
        <>
            <div className="mx-auto mb-6 w-full max-w-xs">
                <Label htmlFor="language-select" className="mb-2 flex items-center justify-center text-sm font-medium text-muted-foreground">
                    <Globe className="mr-2 h-4 w-4" />
                    Select Language
                </Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger id="language-select">
                        <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableLanguages.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {user ? (
                <Tabs defaultValue={sortedQuizSets.length > 0 ? sortedQuizSets[0].id : ''} className="w-full">
                    <TabsList className="flex h-auto flex-wrap justify-center gap-2">
                    {sortedQuizSets.map((set) => (
                        <TabsTrigger key={set.id} value={set.id}>
                        {set.title}
                        </TabsTrigger>
                    ))}
                    </TabsList>
                    {sortedQuizSets.map((set) => (
                    <TabsContent key={set.id} value={set.id} className="pt-6">
                        <QuizSetComponent quizSet={set} onStart={handleStartAttempt} selectedLanguage={selectedLanguage} />
                    </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg shadow-sm bg-muted/50">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Please log in to start the quiz.</h3>
                    <p className="text-muted-foreground mb-4">You need an account to track your progress.</p>
                    <Button size="lg" onClick={() => router.push('/login')}>
                    <LogIn className="mr-2 h-4 w-4" /> Go to Login
                    </Button>
                </div>
            )}
        </>
    );
}
