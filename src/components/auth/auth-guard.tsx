
'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  // Define if the current path should bypass the strict auth check
  const isPublicUserDetailsPath = pathname.startsWith('/users/');

  useEffect(() => {
    // If it's the public user details path, don't enforce login redirect
    if (isPublicUserDetailsPath) {
      return;
    }

    // For all other paths, enforce authentication
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, pathname, isPublicUserDetailsPath]); // Added pathname and isPublicUserDetailsPath

  // If it's a public user details path, render children directly
  // This allows the page to be viewed without login, but still within the app's layout
  if (isPublicUserDetailsPath) {
    return <>{children}</>;
  }

  // For protected paths, show loading or redirect
  if (loading || !user) {
    return <Loading />;
  }

  return <>{children}</>;
}
