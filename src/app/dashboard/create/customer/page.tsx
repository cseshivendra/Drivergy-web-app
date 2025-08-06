
import RegistrationForm from '@/components/forms/registration-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User } from 'lucide-react';
import Image from 'next/image';

export default function CreateCustomerPage() {
  return (
    <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-56 w-full bg-primary/10">
            <Image
                src="https://placehold.co/800x300/3b82f6/ffffff.png"
                alt="New customer registration banner"
                layout="fill"
                objectFit="cover"
                data-ai-hint="happy student driver"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                <div className="p-3 bg-background/80 rounded-full mb-3 backdrop-blur-sm">
                    <User className="h-10 w-10 text-primary" />
                </div>
                <h1 className="font-headline text-4xl font-bold text-white drop-shadow-md">Register New Customer</h1>
                <p className="mt-2 text-lg text-white/90 max-w-xl mx-auto drop-shadow-sm">
                    Fill in the details below to add a new customer to the platform.
                </p>
            </div>
        </div>
        <CardContent className="p-6">
          <RegistrationForm userRole="customer" />
        </CardContent>
      </Card>
    </div>
  );
}
