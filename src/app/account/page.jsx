import { Suspense } from 'react';
import AccountPage from '../../views/AccountPage';

export const metadata = {
  title: 'My VIP Account & Orders | Miraya by Garima',
  description: 'Track orders, view receipts, manage saved measurements and delivery addresses.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Account...</div>}>
      <AccountPage />
    </Suspense>
  );
}
