'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

export default function NewEventRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на страницу создания события
    router.push('/admin/schedule/create');
  }, [router]);

  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-40">
          <BasketballSpinner label="Перенаправление на страницу создания события..." />
        </div>
      </div>
    </RoleProtectedLayout>
  );
} 