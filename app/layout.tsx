import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/providers/SessionProvider';
import { cn } from '@/lib/utils';
import { Toaster } from 'react-hot-toast';

// Указываем, что корневой лейаут должен быть динамическим
// Это решит проблему с серверными компонентами
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Система управления баскетбольным клубом',
  description: 'Платформа для управления баскетбольным клубом: игроки, тренеры, команды, матчи и статистика',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru">
      <body className={cn('min-h-screen bg-gray-50', inter.className)}>
        <SessionProvider session={session}>
          {children}
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
} 