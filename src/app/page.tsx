
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from './loading';

/**
 * The root page of the application.
 *
 * This page's sole purpose is to redirect users to the public-facing
 * homepage located at `/site`. This is the standard pattern for structuring
 * a Next.js app with separate public and authenticated sections.
 */
export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/site');
  }, [router]);

  // Display a loading component while the redirect is in progress.
  // This prevents a flash of a blank page.
  return <Loading />;
}
