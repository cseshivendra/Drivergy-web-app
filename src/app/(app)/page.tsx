'use client';

import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import CustomerDashboard from '@/components/dashboard/customer-dashboard';
import TrainerDashboard from '@/components/dashboard/trainer-dashboard';

export default function AuthenticatedRootPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  // The layout already protects this route, so we can assume user exists.
  // We check their role to render the correct dashboard.
  if (user?.uniqueId?.startsWith('CU')) {
    return <CustomerDashboard />;
  }

  if (user?.uniqueId?.startsWith('TR')) {
    return <TrainerDashboard />;
  }

  // Default to Admin Dashboard for any other authenticated user type.
  return <AdminDashboard />;
}
