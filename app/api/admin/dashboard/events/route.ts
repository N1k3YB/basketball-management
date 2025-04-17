import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/dashboard/events - получение ближайших событий для дашборда администратора
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
    
    // Получаем ближайшие события
    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        startTime: {
          gte: now
        }
      },
      include: {
        eventTeams: {
          include: {
            team: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 10 // Берем 10 ближайших событий
    });
    
    // Форматируем данные для ответа
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      startTime: event.startTime.toISOString(),
      location: event.location,
      teams: event.eventTeams.map(et => ({
        name: et.team.name
      }))
    }));
    
    return NextResponse.json(formattedEvents);
    
  } catch (error) {
    console.error('Ошибка при получении событий:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении событий' },
      { status: 500 }
    );
  }
} 