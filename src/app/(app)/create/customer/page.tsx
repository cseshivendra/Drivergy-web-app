
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is now deprecated in favor of the unified /site/register page.
// We will redirect any users who land here.
export default function CreateCustomerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/site/register');
  }, [router]);

  return null; // Render nothing while redirecting
}
