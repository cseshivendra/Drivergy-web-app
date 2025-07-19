
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

// This page is now deprecated in favor of the unified /site/register page.
// We will redirect any users who land here to avoid confusion and build errors.
export default function DeprecatedCreateCustomerPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/site/register');
    }, [router]);

    // Render a loading state to avoid a blank screen during the redirect.
    return <Loading />;
}
