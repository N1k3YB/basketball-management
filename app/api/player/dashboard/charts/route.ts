import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/player/dashboard/charts - получение данных для графиков на дашборде игрока
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
    
    // Получаем команды, в которых состоит игрок
    const playerTeams = await prisma.teamPlayer.findMany({
      where: {
        playerId: player.id
      },
      select: {
        teamId: true
      }
    });
    
    const teamIds = playerTeams.map(team => team.teamId);
    
    if (teamIds.length === 0) {
      // Если у игрока нет команд, возвращаем пустые данные для графиков
      return NextResponse.json({
        upcomingEventsByMonth: {
          labels: getNextMonthsLabels(6),
          training: Array(6).fill(0),
          matches: Array(6).fill(0),
          meetings: Array(6).fill(0)
        }
      });
    }
    
    // Получаем предстоящие события по месяцам для команд игрока
    // Данные для графика событий по месяцам
    const currentDate = new Date();
    const nextMonths = [];
    
    for (let i = 0; i < 6; i++) {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(currentDate.getMonth() + i);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(nextMonth);
      endOfMonth.setMonth(nextMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      nextMonths.push({
        start: nextMonth,
        end: endOfMonth,
        monthName: nextMonth.toLocaleString('ru-RU', { month: 'long' })
      });
    }
    
    // Запрос для подсчета тренировок, матчей и собраний по месяцам
    const eventsByMonth = await Promise.all(
      nextMonths.map(async (month) => {
        const trainings = await prisma.event.count({
          where: {
            eventType: 'TRAINING',
            startTime: {
              gte: month.start,
              lte: month.end
            },
            eventTeams: {
              some: {
                teamId: {
                  in: teamIds
                }
              }
            }
          }
        });
        
        const matches = await prisma.event.count({
          where: {
            eventType: 'MATCH',
            startTime: {
              gte: month.start,
              lte: month.end
            },
            eventTeams: {
              some: {
                teamId: {
                  in: teamIds
                }
              }
            }
          }
        });
        
        const meetings = await prisma.event.count({
          where: {
            eventType: 'MEETING',
            startTime: {
              gte: month.start,
              lte: month.end
            },
            eventTeams: {
              some: {
                teamId: {
                  in: teamIds
                }
              }
            }
          }
        });
        
        return {
          month: month.monthName,
          trainings,
          matches,
          meetings
        };
      })
    );
    
    // Формируем данные для графика событий по месяцам
    const upcomingEventsByMonth = {
      labels: eventsByMonth.map(month => month.month),
      training: eventsByMonth.map(month => month.trainings),
      matches: eventsByMonth.map(month => month.matches),
      meetings: eventsByMonth.map(month => month.meetings)
    };
    
    return NextResponse.json({
      upcomingEventsByMonth
    });
  } catch (error) {
    console.error('Ошибка при получении данных для графиков:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных для графиков' },
      { status: 500 }
    );
  }
}

// Получение меток для следующих N месяцев
function getNextMonthsLabels(count: number): string[] {
  const currentDate = new Date();
  const labels = [];
  
  for (let i = 0; i < count; i++) {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(currentDate.getMonth() + i);
    labels.push(nextMonth.toLocaleString('ru-RU', { month: 'long' }));
  }
  
  return labels;
} 