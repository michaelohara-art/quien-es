'use client';

import { useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();

  return (
    <div className="container">
      Welcome, {searchParams.get('user')}
    </div>
  );
}
