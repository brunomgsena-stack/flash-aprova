import { Suspense } from 'react';
import DashboardTour from '@/components/DashboardTour';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <DashboardTour />
      </Suspense>
    </>
  );
}
