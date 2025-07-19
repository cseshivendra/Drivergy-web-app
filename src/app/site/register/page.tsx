'use client';

import { useState, useEffect } from 'react'; // Added useEffect import
import RegistrationForm from '@/components/forms/registration-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, UserCog, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation'; // Added useSearchParams import
import Link from 'next/link'; // Added Link import as it's used in the original code, but was missing in the conflict snippet

const RoleSelectionCard = ({ icon: Icon, title, description, onClick }: { icon: React.ElementType, title: string, description: string, onClick: () => void }) => (
    <Card
        className="text-center p-6 shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-primary"
        onClick={onClick}
    >
        <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10 p-4 w-fit">
            <Icon className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-xl font-bold">{title}</CardTitle>
        <CardDescription className="mt-2 text-muted-foreground">{description}</CardDescription>
    </Card>
);

export default function UnifiedRegisterPage() {
    const [selectedRole, setSelectedRole] = useState<'customer' | 'trainer' | null>(null);
    const searchParams = useSearchParams();
    const planFromUrl = searchParams.get('plan');

    useEffect(() => {
        if (planFromUrl) {
            setSelectedRole('customer');
        }
    }, [planFromUrl]);

    const handleRoleSelection = (role: 'customer' | 'trainer') => {
        setSelectedRole(role);
    };

    const resetRoleSelection = () => {
        setSelectedRole(null);
    };

    return (
        <div className="container mx-auto max-w-3xl py-8 sm:py-6 lg:py-8">
            {!selectedRole ? (
                <Card className="shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline text-3xl font-bold">Join Drivergy</CardTitle>
                        <CardDescription>First, let's get to know you. Are you here to learn or to teach?</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        <RoleSelectionCard
                            icon={User}
                            title="I'm a Customer"
                            description="I want to find an instructor and learn how to drive."
                            onClick={() => handleRoleSelection('customer')}
                        />
                        <RoleSelectionCard
                            icon={UserCog}
                            title="I'm a Trainer"
                            description="I'm a driving instructor looking to connect with students."
                            onClick={() => handleRoleSelection('trainer')}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card className="shadow-xl">
                    <CardHeader className="relative text-center">
                        <Button variant="ghost" size="sm" className="absolute left-4 top-4 text-muted-foreground" onClick={resetRoleSelection}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
                            {selectedRole === 'customer' ? <User className="h-8 w-8 text-primary" /> : <UserCog className="h-8 w-8 text-primary" />}
                        </div>
                        <CardTitle className="font-headline text-3xl font-bold">
                            Register as a {selectedRole === 'customer' ? 'Customer' : 'Trainer'}
                        </CardTitle>
                        <CardDescription className="flex flex-col items-center gap-1">
                            <span>Join Drivergy! Fill in the details below to get started.</span>
                            <span className="text-xs">Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Log in</Link></span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RegistrationForm userRole={selectedRole} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}