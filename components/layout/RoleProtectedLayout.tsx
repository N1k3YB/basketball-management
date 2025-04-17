'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from './DashboardLayout';

type AllowedRole = 'ADMIN' | 'COACH' | 'PLAYER';

interface RoleProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}

export default function RoleProtectedLayout({
  children,
  allowedRoles,
}: RoleProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Ожидание загрузки сессии
    if (status === 'loading') return;

    // Если не аутентифицирован, перенаправление на страницу входа
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const userRole = session.user.role as AllowedRole;
    
    // Если у пользователя нет необходимой роли, перенаправление на соответствующую домашнюю страницу
    if (!allowedRoles.includes(userRole)) {
      let redirectPath = '/';
      if (userRole === 'ADMIN') redirectPath = '/admin';
      else if (userRole === 'COACH') redirectPath = '/coach';
      else if (userRole === 'PLAYER') redirectPath = '/player';
      
      router.push(redirectPath);
    }
  }, [session, status, router, allowedRoles]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Если у пользователя нет необходимой роли, скрытие содержимого
  if (session && !allowedRoles.includes(session.user.role as AllowedRole)) {
    return null;
  }

  // Если пользователь аутентифицирован и имеет необходимую роль, отображение страницы
  return <DashboardLayout>{children}</DashboardLayout>;
} 