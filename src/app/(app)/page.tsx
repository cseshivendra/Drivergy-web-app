
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

  // The layout already protects this route, so we can assume user exists if not loading.
  if (!user) {
    // This case should ideally not be reached due to layout protection,
    // but as a fallback, show loading or redirect.
    return <Loading />;
  }

  // Check for admin role first.
  if (user.isAdmin) {
    return <AdminDashboard />;
  }
  
  // Check their role to render the correct dashboard.
  if (user.uniqueId?.startsWith('CU')) {
    return <CustomerDashboard />;
  }

  if (user.uniqueId?.startsWith('TR')) {
    return <TrainerDashboard />;
  }

  // Fallback for any other authenticated but non-admin/customer/trainer user.
  // This could be a user signed in with Google who hasn't completed registration.
  return <AdminDashboard />;
}
