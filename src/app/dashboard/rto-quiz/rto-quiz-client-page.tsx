
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { availableLanguages } from '@/types';
import type { QuizSet } from '@/types';
import QuizSetComponent from './quiz-set-component';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchQuizSets } from '@/lib/server-data';

export default function RtoQuizClientPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    useEffect(() => {
        setLoading(true);
        fetchQuizSets().then(data => {
            setQuizSets(data);
            setLoading(false);
        });
    }, []);

    const handleStartAttempt = () => {
        if (!user) {
            router.push('/login');
        }
    };
    
    if (loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-48 mx-auto" />
                <Skeleton className="h-12 w-full" />
                <div className="p-8 border rounded-lg">
                    <Skeleton className="h-8 w-1/2 mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-6" />
                    <Skeleton className="h-12 w-32" />
                </div>
            </div>
        );
    }

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
                quizSets.length > 0 ? (
                <Tabs defaultValue={quizSets[0].id} className="w-full">
                    <TabsList className="flex h-auto flex-wrap justify-center gap-2">
                    {quizSets.map((set) => (
                        <TabsTrigger key={set.id} value={set.id}>
                        {set.title}
                        </TabsTrigger>
                    ))}
                    </TabsList>
                    {quizSets.map((set) => (
                    <TabsContent key={set.id} value={set.id} className="pt-6">
                        <QuizSetComponent quizSet={set} onStart={handleStartAttempt} selectedLanguage={selectedLanguage} />
                    </TabsContent>
                    ))}
                </Tabs>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground h-40">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-lg">No quiz sets found.</p>
                    </div>
                )
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
