
import TrainerWalletView from '@/components/dashboard/trainer-wallet-view';
import { Suspense } from 'react';
import Loading from '@/app/loading';

export default function TrainerWalletPage() {
    return (
        <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8">
            <Suspense fallback={<Loading />}>
                <TrainerWalletView />
            </Suspense>
        </div>
    );
}
