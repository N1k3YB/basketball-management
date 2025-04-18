export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/player/dashboard/stats - получение статистики для дашборда игрока
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
    
    // Получаем количество команд, в которых состоит игрок
    const teamsCount = await prisma.teamPlayer.count({
      where: {
        playerId: player.id
      }
    });
    
    // Получаем предстоящие события игрока (через команды, в которых он состоит)
    const playerTeams = await prisma.teamPlayer.findMany({
      where: {
        playerId: player.id
      },
      select: {
        teamId: true
      }
    });
    
    const teamIds = playerTeams.map(team => team.teamId);
    
    // Получаем количество предстоящих событий
    const upcomingEventsCount = await prisma.event.count({
      where: {
        AND: [
          {
            startTime: {
              gte: new Date()
            }
          },
          {
            eventTeams: {
              some: {
                teamId: {
                  in: teamIds
                }
              }
            }
          }
        ]
      }
    });
    
    return NextResponse.json({
      totalTeams: teamsCount,
      upcomingEvents: upcomingEventsCount
    });
  } catch (error) {
    console.error('Ошибка при получении статистики для дашборда игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
} 