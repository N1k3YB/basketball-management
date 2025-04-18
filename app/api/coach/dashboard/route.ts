export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/coach/dashboard - получение данных для панели тренера
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
        id: true
      }
    });
    
    const teamIds = teams.map(team => team.id);
    
    // Получаем количество игроков в командах тренера
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: {
        teamId: {
          in: teamIds
        },
        isActive: true
      },
      select: {
        playerId: true
      }
    });
    
    // Получаем уникальных игроков (так как один игрок может быть в нескольких командах)
    const uniquePlayerIds = new Set(teamPlayers.map(tp => tp.playerId));
    
    // Получаем количество предстоящих событий для команд тренера
    const now = new Date();
    const eventTeams = await prisma.eventTeam.findMany({
      where: {
        teamId: {
          in: teamIds
        }
      },
      include: {
        event: {
          select: {
            id: true,
            startTime: true
          }
        }
      }
    });
    
    // Фильтруем только будущие события
    const upcomingEventIds = new Set();
    eventTeams.forEach(et => {
      if (et.event.startTime > now) {
        upcomingEventIds.add(et.event.id);
      }
    });
    
    // Возвращаем данные для дашборда
    return NextResponse.json({
      totalPlayers: uniquePlayerIds.size,
      totalTeams: teamIds.length,
      upcomingEvents: upcomingEventIds.size
    });
  } catch (error) {
    console.error('Ошибка при получении данных для дашборда тренера:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных для дашборда тренера' },
      { status: 500 }
    );
  }
} 