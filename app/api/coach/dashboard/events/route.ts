import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/coach/dashboard/events - получение ближайших событий для команд тренера
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
    
    // Проверка роли пользователя
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'COACH') {
      console.log('Access denied: user role is', userRole);
      return NextResponse.json(
        { error: 'Доступ только для тренеров' },
        { status: 403 }
      );
    }

    const userId = session.user?.id;
    
    // Находим запись тренера
    const coach = await prisma.coach.findUnique({
      where: {
        userId: userId
      }
    });
    
    if (!coach) {
      return NextResponse.json(
        { error: 'Профиль тренера не найден' },
        { status: 404 }
      );
    }
    
    // Получаем команды, за которые отвечает тренер
    const teams = await prisma.team.findMany({
      where: {
        coachId: coach.id
      },
      select: {
        id: true,
        name: true
      }
    });
    
    const teamIds = teams.map(team => team.id);
    
    // Получаем будущие события для команд тренера
    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        startTime: {
          gte: now
        },
        eventTeams: {
          some: {
            teamId: {
              in: teamIds
            }
          }
        }
      },
      include: {
        eventTeams: {
          include: {
            team: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 10 // Ограничиваем до 10 ближайших событий
    });

    // Форматируем данные для фронтенда
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      location: event.location,
      status: event.status,
      teams: event.eventTeams.map(et => ({
        id: et.team.id,
        name: et.team.name
      }))
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Ошибка при получении событий для тренера:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении событий для тренера' },
      { status: 500 }
    );
  }
} 