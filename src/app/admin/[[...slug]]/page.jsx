import { Suspense } from 'react';
import AdminDashboard from '../../../views/AdminDashboard';

export const metadata = {
  title: 'Atelier Management Suite | Miraya by Garima',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Admin Atelier...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
