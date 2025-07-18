
import { Suspense } from 'react';
import Loading from '@/app/loading';
import LoginForm from '@/components/forms/login-form';

// This page now acts as a wrapper for the LoginForm.
// By using Suspense, we ensure that the client-side hooks within
// LoginForm do not block the server-side rendering process, fixing the build error.
export default function LoginPage() {
    return (
        <Suspense fallback={<Loading />}>
            <LoginForm />
        </Suspense>
    );
}
