export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Интерфейс для события
interface Event {
  id: string;
  title: string;
  eventType: string;
  startTime: Date;
  location: string | null;
  eventTeams: {
    team: {
      id: string;
      name: string;
    }
  }[];
}

// GET /api/players/me/dashboard - получение данных для личного кабинета игрока
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Проверка роли пользователя
    if (session.user.role !== 'PLAYER') {
      return NextResponse.json(
        { error: 'Доступ только для игроков' },
        { status: 403 }
      );
    }

    // Находим игрока по ID пользователя
    const player = await prisma.player.findFirst({
      where: {
        user: {
          id: session.user.id
        }
      },
      include: {
        user: {
          select: {
            profile: true
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }

    // Получаем команду игрока
    const teamPlayer = await prisma.teamPlayer.findFirst({
      where: {
        playerId: player.id,
        isActive: true
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            coach: {
              include: {
                user: {
                  select: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Получаем предстоящие события для игрока
    const now = new Date();
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startTime: {
          gte: now
        },
        eventPlayers: {
          some: {
            playerId: player.id
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
      take: 5 // ограничиваем до 5 ближайших событий
    });

    // Получаем статистику игрока
    const playerStats = await prisma.playerStat.groupBy({
      by: ['playerId'],
      where: {
        playerId: player.id,
        match: {
          status: 'COMPLETED'
        }
      },
      _sum: {
        points: true,
        rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        minutesPlayed: true
      },
      _count: {
        matchId: true
      }
    });

    // Форматируем данные для ответа
    const formattedEvents = upcomingEvents.map((event: Event) => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      startTime: event.startTime.toISOString(),
      location: event.location,
      team: event.eventTeams[0]?.team || { id: '', name: 'Не указана' }
    }));

    // Форматируем данные о команде
    let playerTeam = null;
    if (teamPlayer) {
      playerTeam = {
        id: teamPlayer.team.id,
        name: teamPlayer.team.name,
        playerPosition: player.position,
        coachName: teamPlayer.team.coach 
          ? `${teamPlayer.team.coach.user.profile?.firstName || ''} ${teamPlayer.team.coach.user.profile?.lastName || ''}` 
          : 'Не назначен'
      };
    }

    // Форматируем данные о статистике
    let formattedStats = null;
    if (playerStats.length > 0) {
      const stats = playerStats[0];
      const gamesPlayed = stats._count.matchId;
      
      formattedStats = {
        points: stats._sum.points ? Number(stats._sum.points) / gamesPlayed : 0,
        rebounds: stats._sum.rebounds ? Number(stats._sum.rebounds) / gamesPlayed : 0,
        assists: stats._sum.assists ? Number(stats._sum.assists) / gamesPlayed : 0,
        steals: stats._sum.steals ? Number(stats._sum.steals) / gamesPlayed : 0,
        blocks: stats._sum.blocks ? Number(stats._sum.blocks) / gamesPlayed : 0,
        minutesPlayed: stats._sum.minutesPlayed ? Number(stats._sum.minutesPlayed) / gamesPlayed : 0,
        gamesPlayed: gamesPlayed
      };
    } else {
      // Если статистики нет, возвращаем нули
      formattedStats = {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        minutesPlayed: 0,
        gamesPlayed: 0
      };
    }

    // Возвращаем все данные для дашборда
    return NextResponse.json({
      upcomingEvents: formattedEvents,
      playerStats: formattedStats,
      playerTeam: playerTeam
    });
  } catch (error) {
    console.error('Ошибка при получении данных для дашборда игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных для дашборда игрока' },
      { status: 500 }
    );
  }
} 