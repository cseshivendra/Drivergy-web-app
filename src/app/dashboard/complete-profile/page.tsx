
import FullCustomerDetailsForm from '@/components/forms/full-customer-details-form';
import { Suspense } from 'react';
import Loading from '@/app/loading';

// This page now uses Suspense to handle the loading of the
// client-side form component, which provides a cleaner separation
// of concerns and a better user experience.
export default function CompleteProfilePage() {
  return (
      <Suspense fallback={<Loading />}>
          <FullCustomerDetailsForm />
      </Suspense>
  );
}
