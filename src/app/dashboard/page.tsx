'use client';

import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import CustomerDashboard from '@/components/dashboard/customer-dashboard';
import TrainerDashboard from '@/components/dashboard/trainer-dashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This forces the page to be rendered dynamically, preventing build-time errors.
export const dynamic = 'force-dynamic';

export default function AuthenticatedRootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to the public homepage if there's no user and loading is done
  useEffect(() => {
    if (!loading) {
        if (!user) {
            router.replace('/');
        } else if (user.contact === 'revenue@drivergy.in') {
            // Specialized Revenue role should go straight to the Revenue module
            router.replace('/dashboard/revenue');
        }
    }
  }, [loading, user, router]);

  if (loading) {
    return <Loading />;
  }
  
  // This page should only be rendered for authenticated users,
  // so we show the appropriate dashboard.
  if (user) {
    // If it's the revenue manager, the useEffect above will handle redirection.
    // While that happens, we show a loader to prevent flashes.
    if (user.contact === 'revenue@drivergy.in') {
        return <Loading />;
    }

    if (user.isAdmin) {
      return <AdminDashboard />;
    }
    if (user.uniqueId?.startsWith('CU')) {
      return <CustomerDashboard />;
    }
    if (user.uniqueId?.startsWith('TR')) {
      return <TrainerDashboard />;
    }
    // Fallback for any other authenticated user
    return <AdminDashboard />;
  }

  // If no user after loading, show loading spinner while redirecting.
  return <Loading />;
}
