export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/stats/players - получение статистики игроков
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

    // Отладка сессии
    console.log('Session in stats/players API:', session);
    
    // Проверка роли пользователя (приводим к верхнему регистру для надежности)
    const userRole = (session.user?.role || '').toUpperCase();
    if (!['ADMIN', 'COACH'].includes(userRole)) {
      console.log('Access denied to player stats: user role is', userRole);
      return NextResponse.json(
        { error: 'Недостаточно прав для просмотра статистики' },
        { status: 403 }
      );
    }

    // Получаем игроков и их статистику
    const players = await prisma.player.findMany({
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        teamPlayers: {
          where: {
            isActive: true
          },
          include: {
            team: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        playerStats: {
          where: {
            match: {
              status: 'COMPLETED'
            }
          },
          include: {
            match: true
          }
        }
      }
    });

    // Преобразуем данные в нужный формат
    const playersStats = players.map(player => {
      // Считаем статистику игрока по всем матчам
      const gamesPlayed = new Set(player.playerStats.map(stat => stat.matchId)).size;
      
      if (gamesPlayed === 0) {
        return {
          id: player.id,
          userId: player.user.id,
          name: `${player.user.profile?.firstName || ''} ${player.user.profile?.lastName || ''}`,
          team: player.teamPlayers[0]?.team.name || 'Нет команды',
          position: player.position,
          gamesPlayed: 0,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          minutesPlayed: 0
        };
      }
      
      const totalPoints = player.playerStats.reduce((sum, stat) => sum + stat.points, 0);
      const totalRebounds = player.playerStats.reduce((sum, stat) => sum + stat.rebounds, 0);
      const totalAssists = player.playerStats.reduce((sum, stat) => sum + stat.assists, 0);
      const totalSteals = player.playerStats.reduce((sum, stat) => sum + stat.steals, 0);
      const totalBlocks = player.playerStats.reduce((sum, stat) => sum + stat.blocks, 0);
      const totalMinutesPlayed = player.playerStats.reduce((sum, stat) => sum + (stat.minutesPlayed || 0), 0);
      
      return {
        id: player.id,
        userId: player.user.id,
        name: `${player.user.profile?.firstName || ''} ${player.user.profile?.lastName || ''}`,
        team: player.teamPlayers[0]?.team.name || 'Нет команды',
        position: player.position,
        gamesPlayed,
        points: totalPoints,
        rebounds: totalRebounds,
        assists: totalAssists,
        steals: totalSteals,
        blocks: totalBlocks,
        minutesPlayed: totalMinutesPlayed
      };
    });
    
    return NextResponse.json(playersStats);
  } catch (error) {
    console.error('Ошибка при получении статистики игроков:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики игроков' },
      { status: 500 }
    );
  }
} 