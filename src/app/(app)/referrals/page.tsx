
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

// This page is a container for the referrals section.
// It redirects to the main tracking page by default.
export default function ReferralsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/referrals/track');
  }, [router]);

  return <Loading />; // Show loading while redirecting
}
