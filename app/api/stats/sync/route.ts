import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/stats/sync - обновляет статистику команд на основе сыгранных матчей
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }
    
    // Проверка роли пользователя (только админ может запускать синхронизацию)
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для синхронизации статистики' },
        { status: 403 }
      );
    }

    // Получаем все команды
    const teams = await prisma.team.findMany({
      select: {
        id: true
      }
    });

    // Для каждой команды обновляем статистику
    const updateResults = await Promise.all(
      teams.map(async (team) => {
        return await updateTeamStats(team.id);
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Статистика команд успешно синхронизирована',
      results: updateResults
    });
  } catch (error) {
    console.error('Ошибка при синхронизации статистики команд:', error);
    return NextResponse.json(
      { error: 'Ошибка при синхронизации статистики команд' },
      { status: 500 }
    );
  }
}

// Функция для обновления статистики отдельной команды
export async function updateTeamStats(teamId: string) {
  try {
    // Получаем команду с завершенными матчами
    const team = await prisma.team.findUnique({
      where: {
        id: teamId
      },
      include: {
        homeMatches: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            homeScore: true,
            awayScore: true
          }
        },
        awayMatches: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            homeScore: true,
            awayScore: true
          }
        }
      }
    });

    if (!team) {
      return { id: teamId, error: 'Команда не найдена' };
    }

    // Инициализируем статистику с нуля
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;
    
    // Создаем множество для отслеживания уникальных матчей
    const processedMatchIds = new Set<string>();

    // Подсчет для домашних матчей
    team.homeMatches.forEach(match => {
      // Проверяем, что матч еще не обработан
      if (!processedMatchIds.has(match.id) && match.homeScore !== null && match.awayScore !== null) {
        processedMatchIds.add(match.id);
        
        // Проверяем, что команда действительно домашняя в этом матче
        if (match.homeTeamId === teamId) {
          pointsFor += match.homeScore;
          pointsAgainst += match.awayScore;
          
          if (match.homeScore > match.awayScore) wins++;
          else if (match.homeScore < match.awayScore) losses++;
          else draws++;
        }
      }
    });
    
    // Подсчет для выездных матчей
    team.awayMatches.forEach(match => {
      // Проверяем, что матч еще не обработан
      if (!processedMatchIds.has(match.id) && match.homeScore !== null && match.awayScore !== null) {
        processedMatchIds.add(match.id);
        
        // Проверяем, что команда действительно гостевая в этом матче
        if (match.awayTeamId === teamId) {
          pointsFor += match.awayScore;
          pointsAgainst += match.homeScore;
          
          if (match.awayScore > match.homeScore) wins++;
          else if (match.awayScore < match.homeScore) losses++;
          else draws++;
        }
      }
    });
    
    // Общее количество сыгранных матчей - это количество уникальных матчей
    const gamesPlayed = processedMatchIds.size;

    // Обновляем статистику команды - устанавливаем, а не суммируем значения
    await prisma.team.update({
      where: {
        id: teamId
      },
      data: {
        // @ts-ignore - игнорируем ошибку типов, так как мы обновили схему
        gamesPlayed,
        wins,
        losses,
        draws,
        pointsFor,
        pointsAgainst
      }
    });

    return {
      id: teamId,
      name: team.name,
      gamesPlayed,
      wins,
      losses,
      draws,
      pointsFor,
      pointsAgainst
    };
  } catch (error) {
    console.error(`Ошибка при обновлении статистики команды ${teamId}:`, error);
    return { id: teamId, error: 'Внутренняя ошибка сервера' };
  }
}

// Функция для обновления статистики при изменении статуса матча
// Эта функция может вызываться из других API роутов
export async function updateMatchStats(matchId: string) {
  try {
    // Получаем матч
    const match = await prisma.match.findUnique({
      where: {
        id: matchId
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

    if (!match) {
      console.error(`Матч ${matchId} не найден`);
      return false;
    }

    // Если матч не завершен, ничего не делаем
    if (match.status !== 'COMPLETED') {
      return true;
    }

    console.log(`Обновление статистики для матча ${matchId}`);
    
    // Обновляем статистику для домашней команды
    await updateTeamStats(match.homeTeamId);
    
    // Обновляем статистику для гостевой команды только если она отличается от домашней
    if (match.awayTeamId !== match.homeTeamId) {
      await updateTeamStats(match.awayTeamId);
    }
    
    // Создаем множество для отслеживания уникальных игроков
    const uniquePlayerIds = new Set<string>();
    
    // Обновляем статистику для всех игроков, участвовавших в матче
    for (const playerStat of match.playerStats) {
      if (!uniquePlayerIds.has(playerStat.playerId)) {
        uniquePlayerIds.add(playerStat.playerId);
        await updatePlayerStats(playerStat.playerId);
      }
    }

    return true;
  } catch (error) {
    console.error(`Ошибка при обновлении статистики матча ${matchId}:`, error);
    return false;
  }
}

// Функция для обновления статистики отдельного игрока
export async function updatePlayerStats(playerId: string) {
  try {
    // Получаем игрока с его матчами
    const player = await prisma.player.findUnique({
      where: {
        id: playerId
      },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        playerStats: {
          include: {
            match: true
          }
        }
      }
    });

    if (!player) {
      console.error(`Игрок ${playerId} не найден`);
      return { id: playerId, error: 'Игрок не найден' };
    }

    // Фильтруем только статистики с завершенными матчами
    const completedMatchStats = player.playerStats.filter(
      stat => stat.match && stat.match.status === 'COMPLETED'
    );

    // Если нет завершенных матчей, просто возвращаем нулевую статистику
    if (completedMatchStats.length === 0) {
      return {
        id: playerId,
        name: player.user?.profile?.firstName ? `${player.user.profile.firstName} ${player.user.profile?.lastName || ''}` : 'Неизвестный игрок',
        gamesPlayed: 0,
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0
      };
    }

    // Подсчитываем статистику
    const totalPoints = completedMatchStats.reduce((sum: number, stat: any) => sum + stat.points, 0);
    const totalRebounds = completedMatchStats.reduce((sum: number, stat: any) => sum + stat.rebounds, 0);
    const totalAssists = completedMatchStats.reduce((sum: number, stat: any) => sum + stat.assists, 0);
    const totalSteals = completedMatchStats.reduce((sum: number, stat: any) => sum + stat.steals, 0);
    const totalBlocks = completedMatchStats.reduce((sum: number, stat: any) => sum + stat.blocks, 0);
    const totalTurnovers = completedMatchStats.reduce((sum: number, stat: any) => sum + stat.turnovers, 0);
    const gamesPlayed = completedMatchStats.length;

    // Мы не обновляем напрямую игрока, так как в схеме нет полей для статистики
    // Вместо этого просто возвращаем посчитанные данные
    // Если потребуется сохранять эти данные, нужно добавить соответствующие поля
    // в схему модели Player
    
    return {
      id: playerId,
      name: player.user?.profile?.firstName ? `${player.user.profile.firstName} ${player.user.profile?.lastName || ''}` : 'Неизвестный игрок',
      gamesPlayed,
      points: totalPoints,
      pointsPerGame: totalPoints / gamesPlayed,
      rebounds: totalRebounds,
      reboundsPerGame: totalRebounds / gamesPlayed,
      assists: totalAssists,
      assistsPerGame: totalAssists / gamesPlayed,
      steals: totalSteals,
      blocks: totalBlocks,
      turnovers: totalTurnovers
    };
  } catch (error) {
    console.error(`Ошибка при обновлении статистики игрока ${playerId}:`, error);
    return { id: playerId, error: 'Внутренняя ошибка сервера' };
  }
} 