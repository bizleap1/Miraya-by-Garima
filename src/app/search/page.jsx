import { Suspense } from 'react';
import SearchPage from '../../views/SearchPage';

export const metadata = {
  title: 'Search Haute Couture & Bridal Collection | Miraya by Garima',
  description: 'Search designer lehengas, pre-stitched drape sarees, and cocktail gowns.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Search...</div>}>
      <SearchPage />
    </Suspense>
  );
}
