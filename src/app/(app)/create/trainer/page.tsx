
import RegistrationForm from '@/components/forms/registration-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCog } from 'lucide-react';
import Image from 'next/image';

export default function CreateTrainerPage() {
  return (
    <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-48 w-full">
          <Image
            src="https://placehold.co/800x300.png"
            alt="New trainer registration banner"
            layout="fill"
            objectFit="cover"
            data-ai-hint="driving instructor teaching"
          />
        </div>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
            <UserCog className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl font-bold">Register New Trainer</CardTitle>
          <CardDescription>
            Fill in the details below to add a new trainer to the driving school.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm userRole="trainer" />
        </CardContent>
      </Card>
    </div>
  );
}
