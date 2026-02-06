
'use client';

import { useSearchParams } from 'next/navigation';
import RevenueView from '@/components/dashboard/revenue-view';

export default function RevenueManagementPage() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'transactions';

    return (
        <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8">
            <RevenueView activeTab={activeTab} />
        </div>
    );
}
