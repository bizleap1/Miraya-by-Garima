import { Suspense } from 'react';
import CheckoutPage from '../../views/CheckoutPage';

export const metadata = {
  title: 'Secure Checkout | Miraya by Garima',
  description: 'Complete your luxury haute couture order with secure encrypted payment options.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Checkout...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
