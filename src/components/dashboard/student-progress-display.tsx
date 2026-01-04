
'use client';

import type { Skill, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentProgressDisplayProps {
  profile: UserProfile;
}

const getStatusInfo = (status: Skill['status']) => {
  switch (status) {
    case 'Proficient':
      return { icon: CheckCircle, color: 'text-green-500' };
    case 'Needs Practice':
      return { icon: XCircle, color: 'text-destructive' };
    case 'Not Started':
    default:
      return { icon: Clock, color: 'text-muted-foreground' };
  }
};

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
        case 'Gold': return goldSkills;
        case 'Premium': return premiumSkills;
        case 'Basic':
        default: return basicSkills;
    }
};

export default function StudentProgressDisplay({ profile }: StudentProgressDisplayProps) {
  const planSkills = getSkillsForPlan(profile.subscriptionPlan);
  const savedSkillsMap = new Map(profile.skills?.map(s => [s.id, s.status]));

  const skillsToDisplay: Skill[] = planSkills.map(skill => ({
    ...skill,
    status: savedSkillsMap.get(skill.id) || 'Not Started',
  }));

  if (!profile.assignedTrainerId) {
    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <CardHeader>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <BarChart2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline text-xl">My Learning Progress</CardTitle>
                    <CardDescription>Track your driving skills here.</CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">Your progress checklist will appear here once a trainer is assigned to you.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
        <CardHeader>
            <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart2 className="h-7 w-7 text-primary" />
            </div>
            <div>
                <CardTitle className="font-headline text-xl">My Learning Progress</CardTitle>
                <CardDescription>This is how your trainer, {profile.assignedTrainerName}, has rated your skills.</CardDescription>
            </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                {skillsToDisplay.map(skill => {
                    const { icon: Icon, color } = getStatusInfo(skill.status);
                    return (
                        <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <span className="font-medium">{skill.name}</span>
                            <div className={cn("flex items-center gap-2 font-semibold", color)}>
                                <Icon className="h-5 w-5" />
                                <span>{skill.status}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
             {profile.lessonNotes && (
                <div className="mt-6 p-4 border-l-4 border-blue-500 bg-blue-500/10 rounded-r-lg">
                    <h4 className="font-semibold text-lg text-blue-600 mb-2">Latest Note from Your Trainer</h4>
                    <p className="text-foreground/90 italic">"{profile.lessonNotes}"</p>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
