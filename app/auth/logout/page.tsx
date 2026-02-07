// app/auth/logout/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Panggil API logout di server untuk hapus cookie
    const doLogout = async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (err) {
        console.error('Logout API failed, clearing client-side anyway.', err);
      } finally {
        window.location.href = "/auth/login"
      }
    };

    doLogout();
  }, [router]);

  return null; // Tidak perlu render apapun
}