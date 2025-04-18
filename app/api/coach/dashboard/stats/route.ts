export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/coach/dashboard/stats - получение статистики для дашборда тренера
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
        name: true,
        gamesPlayed: true,
        wins: true,
        losses: true,
        draws: true,
        pointsFor: true,
        pointsAgainst: true,
        _count: {
          select: {
            teamPlayers: true
          }
        }
      }
    });
    
    const teamIds = teams.map(team => team.id);
    
    // Количество команд
    const totalTeams = teams.length;
    
    // Количество игроков во всех командах тренера (с учетом того, что игрок может быть в нескольких командах)
    const playersQuery = await prisma.teamPlayer.findMany({
      where: {
        teamId: {
          in: teamIds
        }
      },
      select: {
        playerId: true
      },
      distinct: ['playerId']
    });
    
    const totalPlayers = playersQuery.length;
    
    // Общая статистика по матчам
    const totalGamesPlayed = teams.reduce((sum, team) => sum + team.gamesPlayed, 0);
    const totalWins = teams.reduce((sum, team) => sum + team.wins, 0);
    const totalLosses = teams.reduce((sum, team) => sum + team.losses, 0);
    const totalDraws = teams.reduce((sum, team) => sum + team.draws, 0);
    
    // Получаем количество предстоящих событий для команд тренера
    const now = new Date();
    const next30Days = new Date(now);
    next30Days.setDate(next30Days.getDate() + 30);
    
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
            startTime: true,
            eventType: true
          }
        }
      }
    });
    
    // Фильтруем события, которые должны произойти в ближайшие 30 дней
    const upcomingEvents = eventTeams.filter(et => 
      et.event.startTime >= now && et.event.startTime <= next30Days
    );
    
    // Подсчитываем уникальные события
    const uniqueEventIds = new Set(upcomingEvents.map(ue => ue.event.id));
    
    // Подсчитываем количество событий по типу
    const upcomingTrainings = upcomingEvents.filter(ue => ue.event.eventType === 'TRAINING').length;
    const upcomingMatches = upcomingEvents.filter(ue => ue.event.eventType === 'MATCH').length;
    const upcomingMeetings = upcomingEvents.filter(ue => ue.event.eventType === 'MEETING').length;
    
    return NextResponse.json({
      totalPlayers,
      totalTeams,
      upcomingEvents: uniqueEventIds.size,
      matchesStats: {
        totalGamesPlayed,
        totalWins,
        totalLosses,
        totalDraws,
        winRate: totalGamesPlayed > 0 ? (totalWins / totalGamesPlayed * 100).toFixed(1) : 0
      },
      upcomingEventsByType: {
        trainings: upcomingTrainings,
        matches: upcomingMatches,
        meetings: upcomingMeetings
      },
      teamsList: teams.map(team => ({
        id: team.id,
        name: team.name,
        playersCount: team._count.teamPlayers,
        gamesPlayed: team.gamesPlayed,
        wins: team.wins,
        losses: team.losses,
        draws: team.draws
      }))
    });
  } catch (error) {
    console.error('Ошибка при получении статистики для тренера:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики для тренера' },
      { status: 500 }
    );
  }
} 