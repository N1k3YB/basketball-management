import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'PLAYER') {
      return NextResponse.json(
        { error: 'Нет доступа' },
        { status: 403 }
      );
    }
    
    // Получаем игрока по ID пользователя
    const player = await prisma.player.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        teamPlayers: {
          where: {
            isActive: true
          },
          include: {
            team: true
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

    // Загружаем статистику по всем сыгранным матчам
    const playerStats = await prisma.playerStat.findMany({
      where: {
        playerId: player.id,
        match: {
          status: 'COMPLETED'
        }
      },
      include: {
        match: {
          include: {
            event: true,
            homeTeam: true,
            awayTeam: true
          }
        }
      },
      orderBy: {
        match: {
          event: {
            startTime: 'desc'
          }
        }
      }
    });

    // Получаем агрегированную статистику для общих показателей
    const aggregatedStats = await prisma.playerStat.groupBy({
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
        turnovers: true,
        minutesPlayed: true,
        fieldGoalsAttempted: true,
        fieldGoalsMade: true,
        threePointersAttempted: true,
        threePointersMade: true,
        freeThrowsAttempted: true,
        freeThrowsMade: true
      },
      _count: {
        matchId: true
      }
    });

    if (aggregatedStats.length === 0 || !aggregatedStats[0]._count.matchId) {
      // Если статистики нет, возвращаем нулевые значения
      const emptyOverallStats = {
        totalGames: 0,
        gamesStarted: 0,
        minutesPlayed: 0,
        pointsPerGame: 0,
        assistsPerGame: 0,
        reboundsPerGame: 0,
        stealsPerGame: 0,
        blocksPerGame: 0,
        turnoversPerGame: 0,
        fieldGoalPercentage: 0,
        threePointPercentage: 0,
        freeThrowPercentage: 0,
        averageEfficiency: 0
      };

      return NextResponse.json({
        overallStats: emptyOverallStats,
        gameStats: []
      });
    }

    // Подсчет статистики за все матчи
    const stats = aggregatedStats[0];
    const totalGames = stats._count.matchId;
    
    // На данный момент в модели PlayerStat нет поля isStarter, 
    // поэтому будем считать, что все игроки играли в старте
    const gamesStarted = totalGames;

    // Форматирование общей статистики
    const overallStats = {
      totalGames,
      gamesStarted,
      minutesPlayed: stats._sum.minutesPlayed ? Number(stats._sum.minutesPlayed) / totalGames : 0,
      pointsPerGame: stats._sum.points ? Number(stats._sum.points) / totalGames : 0,
      assistsPerGame: stats._sum.assists ? Number(stats._sum.assists) / totalGames : 0,
      reboundsPerGame: stats._sum.rebounds ? Number(stats._sum.rebounds) / totalGames : 0,
      stealsPerGame: stats._sum.steals ? Number(stats._sum.steals) / totalGames : 0,
      blocksPerGame: stats._sum.blocks ? Number(stats._sum.blocks) / totalGames : 0,
      turnoversPerGame: stats._sum.turnovers ? Number(stats._sum.turnovers) / totalGames : 0,
      fieldGoalPercentage: stats._sum.fieldGoalsAttempted && stats._sum.fieldGoalsAttempted > 0
        ? (Number(stats._sum.fieldGoalsMade) / Number(stats._sum.fieldGoalsAttempted)) * 100
        : 0,
      threePointPercentage: stats._sum.threePointersAttempted && stats._sum.threePointersAttempted > 0
        ? (Number(stats._sum.threePointersMade) / Number(stats._sum.threePointersAttempted)) * 100
        : 0,
      freeThrowPercentage: stats._sum.freeThrowsAttempted && stats._sum.freeThrowsAttempted > 0
        ? (Number(stats._sum.freeThrowsMade) / Number(stats._sum.freeThrowsAttempted)) * 100
        : 0,
      averageEfficiency: 
        (stats._sum.points ? Number(stats._sum.points) : 0) +
        (stats._sum.rebounds ? Number(stats._sum.rebounds) : 0) +
        (stats._sum.assists ? Number(stats._sum.assists) : 0) +
        (stats._sum.steals ? Number(stats._sum.steals) : 0) +
        (stats._sum.blocks ? Number(stats._sum.blocks) : 0) -
        (stats._sum.turnovers ? Number(stats._sum.turnovers) : 0)
    };

    // Получаем ID команды игрока (если есть)
    const teamId = player.teamPlayers[0]?.teamId;

    // Форматирование статистики по матчам
    const gameStats = playerStats.map(stat => {
      // Определяем результат матча для игрока
      const isHomeTeamPlayer = stat.match.homeTeamId === teamId;
      const homeScore = stat.match.homeScore || 0;
      const awayScore = stat.match.awayScore || 0;
      
      let result = 'DRAW';
      if (homeScore > awayScore) {
        result = isHomeTeamPlayer ? 'WIN' : 'LOSS';
      } else if (awayScore > homeScore) {
        result = isHomeTeamPlayer ? 'LOSS' : 'WIN';
      }
      
      // Определяем имя соперника
      let opponent = '';
      if (isHomeTeamPlayer) {
        opponent = stat.match.awayTeam?.name || 'Неизвестно';
      } else {
        opponent = stat.match.homeTeam?.name || 'Неизвестно';
      }

      // Вычисляем эффективность
      const efficiency = 
        stat.points + 
        stat.rebounds + 
        stat.assists + 
        stat.steals + 
        stat.blocks - 
        stat.turnovers;

      return {
        gameId: stat.matchId,
        eventId: stat.match.eventId,
        date: stat.match.event?.startTime?.toISOString().split('T')[0] || '',
        opponent,
        result,
        score: `${stat.match.homeScore || 0}-${stat.match.awayScore || 0}`,
        minutes: stat.minutesPlayed || 0,
        points: stat.points,
        assists: stat.assists,
        rebounds: stat.rebounds,
        steals: stat.steals,
        blocks: stat.blocks,
        turnovers: stat.turnovers,
        fieldGoals: `${stat.fieldGoalsMade || 0}/${stat.fieldGoalsAttempted || 0}`,
        threePointers: `${stat.threePointersMade || 0}/${stat.threePointersAttempted || 0}`,
        freeThrows: `${stat.freeThrowsMade || 0}/${stat.freeThrowsAttempted || 0}`,
        efficiency
      };
    });
    
    return NextResponse.json({
      overallStats,
      gameStats
    });
    
  } catch (error) {
    console.error('Ошибка при получении статистики игрока:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 