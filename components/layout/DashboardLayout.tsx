'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { binaryToImageUrl } from '@/lib/utils/avatar';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

function NavLink({ href, label, icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md ${
        isActive
          ? 'bg-primary-100 text-primary-800'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

// Обновлённые пункты меню для администратора
const adminMenuItems = [
  { href: '/admin', label: 'Главная', icon: <HomeIcon className="w-5 h-5" /> },
  { 
    href: '/admin/users', 
    label: 'Весь состав', 
    icon: <UsersIcon className="w-5 h-5" />,
    matches: ['/admin/users', '/admin/users/create', '/admin/users/[id]/edit']
  },
  { 
    href: '/admin/teams', 
    label: 'Команды', 
    icon: <UserGroupIcon className="w-5 h-5" />,
    matches: ['/admin/teams', '/admin/teams/create', '/admin/teams/edit']
  },
  { 
    href: '/admin/schedule', 
    label: 'Расписание', 
    icon: <CalendarIcon className="w-5 h-5" />,
    matches: ['/admin/schedule', '/admin/schedule/create', '/admin/schedule/edit']
  },
  { 
    href: '/admin/stats', 
    label: 'Статистика', 
    icon: <ChartBarIcon className="w-5 h-5" />,
    matches: ['/admin/stats']
  },
];

const coachMenuItems = [
  { href: '/coach', label: 'Главная', icon: <HomeIcon className="w-5 h-5" /> },
  { 
    href: '/coach/teams', 
    label: 'Мои команды', 
    icon: <UserGroupIcon className="w-5 h-5" />,
    matches: ['/coach/teams', '/coach/teams/edit']
  },
  { 
    href: '/coach/schedule', 
    label: 'Расписание', 
    icon: <CalendarIcon className="w-5 h-5" />,
    matches: ['/coach/schedule', '/coach/schedule/create', '/coach/schedule/edit']
  },
  { 
    href: '/coach/stats', 
    label: 'Статистика', 
    icon: <ChartBarIcon className="w-5 h-5" />,
    matches: ['/coach/stats']
  },
];

const playerMenuItems = [
  { href: '/player', label: 'Дашборд', icon: <HomeIcon className="w-5 h-5" /> },
  { 
    href: '/player/teams', 
    label: 'Мои команды', 
    icon: <UserGroupIcon className="w-5 h-5" />,
    matches: ['/player/teams']
  },
  { 
    href: '/player/schedule', 
    label: 'Расписание', 
    icon: <CalendarIcon className="w-5 h-5" />,
    matches: ['/player/schedule']
  },
  { 
    href: '/player/stats', 
    label: 'Статистика', 
    icon: <ChartBarIcon className="w-5 h-5" />,
    matches: ['/player/stats']
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Определение меню для показа в зависимости от роли пользователя
  let menuItems = adminMenuItems;
  let rolePath = '/admin';

  if (session?.user.role === 'COACH') {
    menuItems = coachMenuItems;
    rolePath = '/coach';
  } else if (session?.user.role === 'PLAYER') {
    menuItems = playerMenuItems;
    rolePath = '/player';
  }

  // Функция для проверки, активен ли пункт меню
  const isMenuItemActive = (item: any) => {
    if (pathname === item.href) return true;
    if (item.matches && item.matches.some((match: string) => 
      pathname.startsWith(match) || 
      (pathname.includes('/[id]') && match.includes('/edit')))) {
      return true;
    }
    return false;
  };

  // Эффект для конвертации аватара
  useEffect(() => {
    if (session?.user?.avatar) {
      try {
        console.log('Конвертация аватара в DashboardLayout:', {
          avatarExist: !!session.user.avatar
        });
        
        // Если у объекта avatar нет поля type, использование image/jpeg как типа по умолчанию
        const avatarType = (session.user as any).avatarType || 'image/jpeg';
        
        const url = binaryToImageUrl(session.user.avatar, avatarType);
        if (url) {
          setAvatarUrl(url);
          console.log('Аватар в шапке успешно конвертирован');
        } else {
          console.error('Не удалось создать URL для аватара в шапке');
        }
      } catch (error) {
        console.error('Ошибка при конвертации аватара в шапке:', error);
      }
    }
  }, [session?.user?.avatar]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильная боковая панель */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-full max-w-xs pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 p-1">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-md text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center justify-center px-4 pb-5 border-b border-gray-200">
            <Link href={rolePath} className="text-xl font-bold text-primary-600">
              Баскетбольный Клуб
            </Link>
          </div>
          <div className="flex-1 h-0 mt-5 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isMenuItemActive(item)}
                />
              ))}
            </nav>
          </div>
          <div className="border-t border-gray-200 p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
              <span>Выйти</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Десктопная боковая панель */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <Link href={rolePath} className="text-xl font-bold text-primary-600">
              Баскетбольный Клуб
            </Link>
          </div>
          <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isMenuItemActive(item)}
                />
              ))}
            </nav>
          </div>
          <div className="border-t border-gray-200 p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
              <span>Выйти</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Основное содержимое */}
      <div className="md:pl-64">
        <div className="sticky top-0 z-10 flex h-16 bg-white shadow">
          <button
            type="button"
            className="md:hidden px-4 text-gray-500 hover:text-gray-600 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between items-center px-4">
            <div>
              {/* Можно добавить заголовок страницы или поиск */}
            </div>
            <div className="flex items-center">
              <div className="relative">
                <div className="flex items-center">
                  <div className="mr-3 text-right">
                    <div className="text-sm font-medium text-gray-700">
                      {session?.user?.fullName || session?.user?.email || 'Пользователь'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session?.user?.role === 'ADMIN' ? 'Администратор' : 
                       session?.user?.role === 'COACH' ? 'Тренер' : 
                       session?.user?.role === 'PLAYER' ? 'Игрок' : 'Пользователь'}
                    </div>
                  </div>
                  <Link href="/profile">
                    <Avatar 
                      src={avatarUrl}
                      alt={session?.user?.fullName || 'Аватар пользователя'}
                      name={session?.user?.fullName}
                      size="sm"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 