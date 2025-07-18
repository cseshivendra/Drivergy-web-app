
'use client';

import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import CustomerDashboard from '@/components/dashboard/customer-dashboard';
import TrainerDashboard from '@/components/dashboard/trainer-dashboard';

export default function DashboardPage() {
    const { user, loading } = useAuth();

    if (loading || !user) {
        return <Loading />;
    }

    // Check if the uniqueId starts with 'CU' to show customer dashboard
    if (user.uniqueId && user.uniqueId.startsWith('CU')) {
        return <CustomerDashboard />;
    }

    // Check if the uniqueId starts with 'TR' to show trainer dashboard
    if (user.uniqueId && user.uniqueId.startsWith('TR')) {
        return <TrainerDashboard />;
    }

    // Default to Admin Dashboard for guests, Google sign-ins, or other non-customer/trainer roles
    return <AdminDashboard />;
}
