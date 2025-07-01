
'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // The user details page is inside the app layout but can be viewed publicly.
  const isPublicAppPage = pathname.startsWith('/users/');

  useEffect(() => {
    // If we're not loading and there's no user, redirect to login,
    // UNLESS it's a page that's allowed to be public.
    if (!loading && !user && !isPublicAppPage) {
      router.push('/login');
    }
  }, [user, loading, router, pathname, isPublicAppPage]);

  // While auth state is loading, always show the loading screen.
  // This prevents the UI from flashing a "logged out" state.
  if (loading) {
    return <Loading />;
  }

  // If we have a user OR it's a public page, show the content.
  // The user object will be available (or null) for the sidebar to use correctly.
  if (user || isPublicAppPage) {
    return <>{children}</>;
  }

  // If there's no user and it's not a public page, show loading while redirecting.
  return <Loading />;
}
