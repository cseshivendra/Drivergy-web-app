'use client';

import FullCustomerDetailsForm from '@/components/forms/full-customer-details-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';

export default function CompleteProfilePage() {
  const { loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

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
