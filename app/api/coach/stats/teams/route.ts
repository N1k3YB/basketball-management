export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/coach/stats/teams - получение статистики команд тренера
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

    // Получаем команды этого тренера
    const teams = await prisma.team.findMany({
      where: {
        coachId: coach.id
      },
      include: {
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