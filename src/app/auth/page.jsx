import { Suspense } from 'react';
import AuthPage from '../../views/AuthPage';

export const metadata = {
  title: 'Client Sign In & VIP Registration | Miraya by Garima',
  description: 'Access your Miraya by Garima couture profile and order history via OTP authentication.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <AuthPage />
    </Suspense>
  );
}
