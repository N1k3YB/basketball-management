export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/dashboard/stats - получение статистики для дашборда администратора
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка аутентификации
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    // Проверка роли пользователя
    const userRole = session.user.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }
    
    // Получаем общую статистику
    const [
      totalTeams,
      totalPlayers,
      totalCoaches,
      upcomingEvents
    ] = await Promise.all([
      // Общее количество команд
      prisma.team.count(),
      
      // Общее количество активных игроков (уникальных)
      prisma.player.count(),
      
      // Общее количество тренеров
      prisma.coach.count(),
      
      // Количество предстоящих событий
      prisma.event.count({
        where: {
          startTime: {
            gte: new Date()
          }
        }
      })
    ]);
    
    return NextResponse.json({
      totalTeams,
      totalPlayers,
      totalCoaches,
      upcomingEvents
    });
    
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
} 