import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Интерфейс для команды с матчами
interface TeamWithMatches {
  id: string;
  name: string;
  description?: string | null;
  homeMatches: {
    homeScore: number | null;
    awayScore: number | null;
    status: string;
  }[];
  awayMatches: {
    homeScore: number | null;
    awayScore: number | null;
    status: string;
  }[];
}

// Интерфейс для матча
interface Match {
  homeScore: number | null;
  awayScore: number | null;
}

// GET /api/stats/teams - получение статистики команд
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

    // Проверка роли пользователя (приводим к верхнему регистру для надежности)
    const userRole = (session.user?.role || '').toUpperCase();
    if (!['ADMIN', 'COACH'].includes(userRole)) {
      console.log('Access denied to team stats: user role is', userRole);
      return NextResponse.json(
        { error: 'Недостаточно прав для просмотра статистики команд' },
        { status: 403 }
      );
    }

    // Получаем команды с данными статистики
    const teams = await prisma.team.findMany({
      include: {
        coach: {
          include: {
            user: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        teamPlayers: {
          where: {
            isActive: true
          }
        }
      }
    });

    // Преобразуем данные в подходящий формат для фронтенда
    const teamsStats = teams.map(team => {
      // Безопасно обращаемся к статистическим полям с дефолтными значениями
      const gamesPlayed = (team as any).gamesPlayed || 0;
      const wins = (team as any).wins || 0;
      const losses = (team as any).losses || 0;
      const draws = (team as any).draws || 0;
      const pointsFor = (team as any).pointsFor || 0;
      const pointsAgainst = (team as any).pointsAgainst || 0;
      
      // Расчет процента побед
      const winPercentage = gamesPlayed > 0 
        ? (wins / gamesPlayed * 100) 
        : 0;
      
      return {
        id: team.id,
        name: team.name,
        coach: team.coach 
          ? `${team.coach.user.profile?.firstName || ''} ${team.coach.user.profile?.lastName || ''}`.trim() 
          : 'Нет тренера',
        playersCount: team.teamPlayers.length,
        gamesPlayed,
        wins,
        losses,
        draws,
        winPercentage,
        pointsFor,
        pointsAgainst
      };
    });
    
    return NextResponse.json(teamsStats);
  } catch (error) {
    console.error('Ошибка при получении статистики команд:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики команд' },
      { status: 500 }
    );
  }
} 