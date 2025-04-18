export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/roles - получение списка ролей
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Отладка сессии
    console.log('Session in roles API:', session);
    
    // Получаем все роли
    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Ошибка при получении ролей:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении ролей' },
      { status: 500 }
    );
  }
} 