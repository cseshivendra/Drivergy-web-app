
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
    if (!loading && !user) {
        router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return <Loading />;
  }
  
  // This page should only be rendered for authenticated users,
  // so we show the appropriate dashboard.
  if (user) {
    // Specialized roles like Content, Revenue, and Operations managers use the AdminDashboard component
    // which handles role-based content logic.
    const isManager = 
        user.contact === 'content@drivergy.in' || 
        user.contact === 'revenue@drivergy.in' || 
        user.contact === 'operations@drivergy.in';

    if (user.isAdmin || isManager) {
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
