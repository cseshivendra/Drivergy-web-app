
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

const initialSkills: Skill[] = [
    { id: 'steering', name: 'Steering Control & Basic Maneuvers', status: 'Not Started' },
    { id: 'gear', name: 'Gear Shifting & Clutch Control (Manual)', status: 'Not Started' },
    { id: 'braking', name: 'Braking Techniques', status: 'Not Started' },
    { id: 'lane', name: 'Lane Discipline & Changing Lanes', status: 'Not Started' },
    { id: 'traffic', name: 'Navigating Light & Heavy Traffic', status: 'Not Started' },
    { id: 'parking-parallel', name: 'Parallel Parking', status: 'Not Started' },
    { id: 'parking-perpendicular', name: 'Perpendicular & Angle Parking', status: 'Not Started' },
    { id: 'u-turn', name: 'U-Turns & Three-Point Turns', status: 'Not Started' },
    { id: 'highway', name: 'Highway Driving & Overtaking', status: 'Not Started' },
    { id: 'night', name: 'Night Driving', status: 'Not Started' },
    { id: 'reverse', name: 'Reversing & Reverse Parking', status: 'Not Started' },
    { id: 'slopes', name: 'Uphill & Downhill Driving', status: 'Not Started' },
];

export default function StudentProgressPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.studentId as string;
    const { toast } = useToast();

    const [student, setStudent] = useState<UserProfile | null>(null);
    const [skills, setSkills] = useState<Skill[]>(initialSkills);
    const [lessonNotes, setLessonNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (studentId) {
            setLoading(true);
            fetchUserById(studentId).then(userProfile => {
                if (userProfile) {
                    setStudent(userProfile);
                    // If skills are already saved on the profile, use them
                    if (userProfile.skills && userProfile.skills.length > 0) {
                        setSkills(userProfile.skills);
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
                            <CardDescription>Track and update the student's driving skills.</CardDescription>
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

