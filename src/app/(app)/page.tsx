
'use client';

import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import CustomerDashboard from '@/components/dashboard/customer-dashboard';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <Loading />;
  }

  // Check if the uniqueId starts with 'CU' to show customer dashboard
  if (user.uniqueId && user.uniqueId.startsWith('CU')) {
    return <CustomerDashboard />;
  }
  
  // Note: a check for 'TR' for a trainer dashboard could be added here in the future
  // if (user.uniqueId && user.uniqueId.startsWith('TR')) {
  //   return <TrainerDashboard />;
  // }

  // Default to Admin Dashboard for guests, Google sign-ins, or other non-customer roles
  return <AdminDashboard />;
}
