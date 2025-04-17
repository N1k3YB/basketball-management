'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      // Проверка авторизации пользователя, перенаправление на страницу входа при отсутствии сессии
      router.push('/auth/login');
    } else {
      // Перенаправление пользователя на соответствующую страницу в зависимости от его роли
      const userRole = session.user.role;
      if (userRole === 'ADMIN') {
        router.push('/admin');
      } else if (userRole === 'COACH') {
        router.push('/coach');
      } else if (userRole === 'PLAYER') {
        router.push('/player');
      } else {
        // Перенаправление на страницу входа при неопределенной или неизвестной роли
        router.push('/auth/login');
      }
    }
  }, [session, status, router]);

  // Отображение индикатора загрузки во время обработки перенаправления
  if (status === 'loading') return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <BasketballSpinner label="Загрузка..." />
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-screen">
      <BasketballSpinner label="Загрузка..." />
    </div>
  );
} 