
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchUserById } from '@/lib/server-data';
import { updateStudentProgress } from '@/lib/server-actions';
import type { UserProfile, Skill, SkillStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, ArrowLeft, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const basicSkills: Omit<Skill, 'status'>[] = [
    { id: 'steering', name: 'Steering Control & Basic Maneuvers' },
    { id: 'gear', name: 'Gear Shifting & Clutch Control (Manual)' },
    { id: 'braking', name: 'Braking Techniques' },
    { id: 'lane', name: 'Lane Discipline' },
    { id: 'reverse', name: 'Reversing in a Straight Line' },
    { id: 'u-turn', name: 'U-Turns' },
];

const goldSkills: Omit<Skill, 'status'>[] = [
    ...basicSkills,
    { id: 'traffic', name: 'Navigating Light Traffic' },
    { id: 'parking-perpendicular', name: 'Perpendicular Parking' },
    { id: 'slopes', name: 'Uphill & Downhill Driving' },
    { id: 'lane-changing', name: 'Changing Lanes Safely' },
];

const premiumSkills: Omit<Skill, 'status'>[] = [
    ...goldSkills,
    { id: 'traffic-heavy', name: 'Navigating Heavy Traffic' },
    { id: 'parking-parallel', name: 'Parallel Parking' },
    { id: 'highway', name: 'Highway Driving & Overtaking' },
    { id: 'night', name: 'Night Driving' },
    { id: 'three-point', name: 'Three-Point Turns' },
];

const getSkillsForPlan = (plan: string): Omit<Skill, 'status'>[] => {
    switch (plan) {
        case 'Gold':
            return goldSkills;
        case 'Premium':
            return premiumSkills;
        case 'Basic':
        default:
            return basicSkills;
    }
};

export default function StudentProgressPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.studentId as string;
    const { toast } = useToast();

    const [student, setStudent] = useState<UserProfile | null>(null);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [lessonNotes, setLessonNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (studentId) {
            setLoading(true);
            fetchUserById(studentId).then(userProfile => {
                if (userProfile) {
                    setStudent(userProfile);
                    
                    // Determine the initial skill list based on the subscription plan
                    const planSkills = getSkillsForPlan(userProfile.subscriptionPlan);
                    
                    // If skills are already saved on the profile, merge them with the plan's skill list
                    if (userProfile.skills && userProfile.skills.length > 0) {
                        const savedSkillsMap = new Map(userProfile.skills.map(s => [s.id, s.status]));
                        const mergedSkills = planSkills.map(skill => ({
                            ...skill,
                            status: savedSkillsMap.get(skill.id) || 'Not Started',
                        }));
                        setSkills(mergedSkills);
                    } else {
                        // Otherwise, initialize all skills with 'Not Started'
                        const initialSkills = planSkills.map(skill => ({ ...skill, status: 'Not Started' as SkillStatus }));
                        setSkills(initialSkills);
                    }

                    if (userProfile.lessonNotes) {
                        setLessonNotes(userProfile.lessonNotes);
                    }
                } else {
                    toast({ title: "Error", description: "Student not found.", variant: "destructive" });
                    router.push('/dashboard');
                }
                setLoading(false);
            });
        }
    }, [studentId, router, toast]);

    const handleStatusChange = (skillId: string, newStatus: SkillStatus) => {
        setSkills(currentSkills =>
            currentSkills.map(skill =>
                skill.id === skillId ? { ...skill, status: newStatus } : skill
            )
        );
    };

    const handleSaveProgress = async () => {
        if (!student) return;
        setIsSaving(true);
        const success = await updateStudentProgress(student.id, skills, lessonNotes);
        if (success) {
            toast({ title: "Progress Saved", description: `Progress for ${student.name} has been updated.` });
        } else {
            toast({ title: "Error", description: "Failed to save progress.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    if (loading) {
        return (
             <div className="container mx-auto max-w-4xl p-4 py-8 space-y-8">
                <Skeleton className="h-10 w-48 mb-6" />
                <Card className="shadow-lg">
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-10 w-48" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!student) {
        return null; // Or a more specific "not found" component
    }

    return (
        <div className="container mx-auto max-w-4xl p-4 py-8 space-y-8">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <User className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-2xl">Progress for {student.name}</CardTitle>
                            <CardDescription>Plan: <span className="font-semibold text-primary">{student.subscriptionPlan}</span>. Track and update driving skills.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Skills Checklist</h3>
                        <div className="space-y-3">
                            {skills.map(skill => (
                                <div key={skill.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg bg-muted/50">
                                    <span className="font-medium mb-2 sm:mb-0">{skill.name}</span>
                                    <Select value={skill.status} onValueChange={(value: SkillStatus) => handleStatusChange(skill.id, value)}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Set status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Not Started"><Clock className="mr-2 h-4 w-4 inline-block" />Not Started</SelectItem>
                                            <SelectItem value="Needs Practice"><XCircle className="mr-2 h-4 w-4 inline-block text-destructive" />Needs Practice</SelectItem>
                                            <SelectItem value="Proficient"><CheckCircle className="mr-2 h-4 w-4 inline-block text-green-500" />Proficient</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="lesson-notes" className="text-lg font-semibold mb-2 block">Lesson Notes</Label>
                        <Textarea
                            id="lesson-notes"
                            value={lessonNotes}
                            onChange={(e) => setLessonNotes(e.target.value)}
                            placeholder={`Add notes for ${student.name}'s recent lesson...`}
                            rows={5}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveProgress} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Progress
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
