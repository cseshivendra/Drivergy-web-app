
'use client';

import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import CustomerDashboard from '@/components/dashboard/customer-dashboard';
import TrainerDashboard from '@/components/dashboard/trainer-dashboard';
import PortfolioSitePage from '@/app/site/page';

export default function RootPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    // If there is no user, show the public marketing site page.
    if (!user) {
        return <PortfolioSitePage />;
    }

    // If a user is logged in, show the appropriate dashboard based on their role.
    if (user.uniqueId?.startsWith('CU')) {
        return <CustomerDashboard />;
    }

    if (user.uniqueId?.startsWith('TR')) {
        return <TrainerDashboard />;
    }

    // Default to Admin Dashboard for any other authenticated user type.
    return <AdminDashboard />;
}
