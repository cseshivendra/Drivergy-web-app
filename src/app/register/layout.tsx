
import { Suspense } from 'react';
import Loading from '@/app/loading';
import type { ReactNode } from 'react';

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
