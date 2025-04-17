import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/player/schedule - получение расписания для игрока
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
    if (userRole !== 'PLAYER') {
      console.log('Access denied: user role is', userRole);
      return NextResponse.json(
        { error: 'Доступ только для игроков' },
        { status: 403 }
      );
    }

    const userId = session.user?.id;
    
    // Находим запись игрока
    const player = await prisma.player.findUnique({
      where: {
        userId: userId
      }
    });
    
    if (!player) {
      return NextResponse.json(
        { error: 'Профиль игрока не найден' },
        { status: 404 }
      );
    }
    
    // Получаем команды, в которых состоит игрок
    const playerTeams = await prisma.teamPlayer.findMany({
      where: {
        playerId: player.id
      },
      select: {
        teamId: true
      }
    });
    
    const teamIds = playerTeams.map(team => team.teamId);
    
    if (teamIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Получаем события для команд игрока
    const events = await prisma.event.findMany({
      where: {
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
      }
    });
    
    // Форматируем данные для ответа
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      status: event.status,
      teams: event.eventTeams.map(et => ({
        id: et.team.id,
        name: et.team.name
      }))
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Ошибка при получении расписания:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении расписания' },
      { status: 500 }
    );
  }
} 