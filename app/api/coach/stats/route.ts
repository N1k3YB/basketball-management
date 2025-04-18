export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MatchStatus } from '@prisma/client';

// GET /api/coach/stats - получение статистики по командам тренера
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
    
    // Получаем параметры
    const url = new URL(request.url);
    const teamId = url.searchParams.get('teamId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    
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
    let teams;
    if (teamId) {
      // Проверяем доступ к конкретной команде
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          coachId: coach.id
        }
      });
      
      if (!team) {
        return NextResponse.json(
          { error: 'Команда не найдена или у вас нет к ней доступа' },
          { status: 403 }
        );
      }
      
      teams = [team];
    } else {
      // Получаем все команды тренера
      teams = await prisma.team.findMany({
        where: {
          coachId: coach.id
        }
      });
    }
    
    // Формируем фильтр по датам
    let dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }
    
    // ID команд тренера
    const teamIds = teams.map(team => team.id);
    
    // Получаем матчи для этих команд
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } }
        ],
        status: 'COMPLETED' as MatchStatus,
        event: {
          startTime: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        }
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        playerStats: {
          include: {
            player: true
          }
        }
      }
    });
    
    // Подсчет количества матчей для каждой команды
    const teamMatches: Record<string, number> = {};
    const teamStats: Record<string, { wins: number; losses: number; draws: number }> = {};
    
    matches.forEach(match => {
      // Инициализация статистики для команд, если она еще не создана
      if (!teamStats[match.homeTeamId]) {
        teamStats[match.homeTeamId] = { wins: 0, losses: 0, draws: 0 };
      }
      if (!teamStats[match.awayTeamId]) {
        teamStats[match.awayTeamId] = { wins: 0, losses: 0, draws: 0 };
      }
      
      // Подсчет количества матчей
      teamMatches[match.homeTeamId] = (teamMatches[match.homeTeamId] || 0) + 1;
      teamMatches[match.awayTeamId] = (teamMatches[match.awayTeamId] || 0) + 1;
      
      // Подсчет побед/поражений/ничьих
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;
      
      if (homeScore > awayScore) {
        teamStats[match.homeTeamId].wins += 1;
        teamStats[match.awayTeamId].losses += 1;
      } else if (homeScore < awayScore) {
        teamStats[match.homeTeamId].losses += 1;
        teamStats[match.awayTeamId].wins += 1;
      } else {
        teamStats[match.homeTeamId].draws += 1;
        teamStats[match.awayTeamId].draws += 1;
      }
    });
    
    // Агрегация статистики по игрокам
    const playerStatsMap: Record<string, any[]> = {};
    
    matches.forEach(match => {
      if (match.playerStats) {
        match.playerStats.forEach(stat => {
          if (stat.player && (stat.player as any).teamId && teamIds.includes((stat.player as any).teamId)) {
            const playerId = stat.player.id;
            
            if (!playerStatsMap[playerId]) {
              playerStatsMap[playerId] = [];
            }
            
            playerStatsMap[playerId].push({
              matchId: match.id,
              minutes: (stat as any).minutes || 0,
              points: (stat as any).points || 0,
              assists: (stat as any).assists || 0,
              rebounds: (stat as any).rebounds || 0,
              steals: (stat as any).steals || 0,
              blocks: (stat as any).blocks || 0,
              turnovers: (stat as any).turnovers || 0,
              fouls: (stat as any).fouls || 0,
              fieldGoalsMade: (stat as any).fieldGoalsMade || 0,
              fieldGoalsAttempted: (stat as any).fieldGoalsAttempted || 0,
              threePointersMade: (stat as any).threePointersMade || 0,
              threePointersAttempted: (stat as any).threePointersAttempted || 0,
              freeThrowsMade: (stat as any).freeThrowsMade || 0,
              freeThrowsAttempted: (stat as any).freeThrowsAttempted || 0,
              player: stat.player
            });
          }
        });
      }
    });
    
    // Расчет средних показателей для каждого игрока
    const aggregatedPlayerStats = Object.entries(playerStatsMap).map(([playerId, stats]) => {
      const gamesPlayed = stats.length;
      const lastStat = stats[stats.length - 1]; // Используем последнюю статистику для получения информации об игроке
      
      // Расчет сумм для каждого показателя
      const totals = stats.reduce((acc, curr) => ({
        minutes: acc.minutes + curr.minutes,
        points: acc.points + curr.points,
        assists: acc.assists + curr.assists,
        rebounds: acc.rebounds + curr.rebounds,
        steals: acc.steals + curr.steals,
        blocks: acc.blocks + curr.blocks,
        turnovers: acc.turnovers + curr.turnovers,
        fouls: acc.fouls + curr.fouls,
        fieldGoalsMade: acc.fieldGoalsMade + curr.fieldGoalsMade,
        fieldGoalsAttempted: acc.fieldGoalsAttempted + curr.fieldGoalsAttempted,
        threePointersMade: acc.threePointersMade + curr.threePointersMade,
        threePointersAttempted: acc.threePointersAttempted + curr.threePointersAttempted,
        freeThrowsMade: acc.freeThrowsMade + curr.freeThrowsMade,
        freeThrowsAttempted: acc.freeThrowsAttempted + curr.freeThrowsAttempted
      }), {
        minutes: 0,
        points: 0,
        assists: 0,
        rebounds: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0
      });
      
      // Расчет средних значений и процентов
      const fieldGoalPercentage = totals.fieldGoalsAttempted > 0 
        ? (totals.fieldGoalsMade / totals.fieldGoalsAttempted) * 100 
        : 0;
        
      const threePointPercentage = totals.threePointersAttempted > 0 
        ? (totals.threePointersMade / totals.threePointersAttempted) * 100 
        : 0;
        
      const freeThrowPercentage = totals.freeThrowsAttempted > 0 
        ? (totals.freeThrowsMade / totals.freeThrowsAttempted) * 100 
        : 0;
      
      return {
        playerId,
        player: {
          id: lastStat.player.id,
          firstName: lastStat.player.firstName,
          lastName: lastStat.player.lastName,
          fullName: `${lastStat.player.firstName} ${lastStat.player.lastName}`,
          number: lastStat.player.number,
          position: lastStat.player.position,
          teamId: lastStat.player.teamId
        },
        gamesPlayed,
        stats: {
          ppg: totals.points / gamesPlayed, // points per game
          apg: totals.assists / gamesPlayed, // assists per game
          rpg: totals.rebounds / gamesPlayed, // rebounds per game
          spg: totals.steals / gamesPlayed, // steals per game
          bpg: totals.blocks / gamesPlayed, // blocks per game
          tpg: totals.turnovers / gamesPlayed, // turnovers per game
          fpg: totals.fouls / gamesPlayed, // fouls per game
          mpg: totals.minutes / gamesPlayed, // minutes per game
          fgp: fieldGoalPercentage.toFixed(1), // field goal percentage
          tpp: threePointPercentage.toFixed(1), // three point percentage
          ftp: freeThrowPercentage.toFixed(1), // free throw percentage
        },
        totals: {
          points: totals.points,
          assists: totals.assists,
          rebounds: totals.rebounds,
          steals: totals.steals,
          blocks: totals.blocks,
          turnovers: totals.turnovers,
          fouls: totals.fouls,
          minutes: totals.minutes,
          fieldGoalsMade: totals.fieldGoalsMade,
          fieldGoalsAttempted: totals.fieldGoalsAttempted,
          threePointersMade: totals.threePointersMade,
          threePointersAttempted: totals.threePointersAttempted,
          freeThrowsMade: totals.freeThrowsMade,
          freeThrowsAttempted: totals.freeThrowsAttempted
        }
      };
    }).sort((a, b) => b.stats.ppg - a.stats.ppg); // Сортировка по очкам за игру
    
    // Готовим ответ с данными по командам и статистике игроков
    const teamDetails = teams.map(team => {
      const matches = teamMatches[team.id] || 0;
      const stats = teamStats[team.id] || { wins: 0, losses: 0, draws: 0 };
      
      return {
        id: team.id,
        name: team.name,
        logoUrl: (team as any).logoUrl || null,
        matches: matches,
        records: {
          wins: stats.wins,
          losses: stats.losses,
          draws: stats.draws,
          winRate: matches > 0 ? (stats.wins / matches * 100).toFixed(1) : "0.0"
        }
      };
    });
    
    return NextResponse.json({
      teams: teamDetails,
      matches: matches.length,
      playerStats: aggregatedPlayerStats
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
} 