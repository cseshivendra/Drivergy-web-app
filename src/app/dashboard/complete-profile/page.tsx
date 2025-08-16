
'use client';
import FullCustomerDetailsForm from '@/components/forms/full-customer-details-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { Suspense } from 'react';
import Loading from '@/app/loading';

// This is a wrapper component to handle the client-side logic
// within a server component page, using Suspense for loading.
function CompleteProfileClientBoundary() {
    
    return (
        <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8">
            <Card className="shadow-xl overflow-hidden">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
                        <UserCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-3xl font-bold">
                        One Last Step!
                    </CardTitle>
                    <CardDescription>
                        Your payment was successful. Please complete your profile to finalize your enrollment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FullCustomerDetailsForm />
                </CardContent>
            </Card>
        </div>
    );
}


export default function CompleteProfilePage() {
  return (
      <Suspense fallback={<Loading />}>
          <CompleteProfileClientBoundary />
      </Suspense>
  );
}
