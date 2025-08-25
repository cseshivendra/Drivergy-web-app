
import { Suspense } from 'react';
import RegisterClientPage from './register-client-page';
import Loading from '../loading';

// This is now a Server Component that wraps the client logic in Suspense.
// This is the correct pattern for pages that use client-side hooks like useSearchParams.
export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterClientPage />
    </Suspense>
  );
}
