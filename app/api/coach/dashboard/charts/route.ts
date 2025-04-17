import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/coach/dashboard/charts - получение данных для графиков на дашборде тренера
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
    
    // Получаем команды, за которые отвечает тренер, с включением статистики
    const teams = await prisma.team.findMany({
      where: {
        coachId: coach.id
      },
      include: {
        teamPlayers: {
          where: {
            isActive: true
          },
          select: {
            playerId: true
          }
        }
      }
    });
    
    const teamIds = teams.map(team => team.id);
    
    // 1. Данные для графика результатов матчей по командам
    const teamsMatchesStats = {
      labels: teams.map(team => team.name),
      wins: teams.map(team => team.wins),
      losses: teams.map(team => team.losses),
      draws: teams.map(team => team.draws)
    };
    
    // 2. Данные для графика распределения игроков по командам
    const teamsPlayersCount = {
      labels: teams.map(team => team.name),
      playersCount: teams.map(team => team.teamPlayers.length)
    };
    
    // 3. Данные для графика предстоящих событий по месяцам
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    
    // Получаем будущие события для команд тренера, сгруппированные по месяцам
    const events = await prisma.event.findMany({
      where: {
        startTime: {
          gte: now,
          lt: sixMonthsLater
        },
        eventTeams: {
          some: {
            teamId: {
              in: teamIds
            }
          }
        }
      },
      select: {
        id: true,
        eventType: true,
        startTime: true
      }
    });
    
    // Создаем массив месяцев для отображения на графике
    const months = [];
    const training = [];
    const matches = [];
    const meetings = [];
    
    // Заполняем данные на 6 месяцев вперед
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() + i);
      
      const monthLabel = monthDate.toLocaleString('ru-RU', { month: 'long' });
      months.push(monthLabel);
      
      // Счетчики для каждого типа события
      let trainingCount = 0;
      let matchCount = 0;
      let meetingCount = 0;
      
      // Подсчитываем количество событий каждого типа за этот месяц
      events.forEach(event => {
        const eventMonth = event.startTime.getMonth();
        const eventYear = event.startTime.getFullYear();
        
        if (eventMonth === monthDate.getMonth() && eventYear === monthDate.getFullYear()) {
          switch (event.eventType) {
            case 'TRAINING':
              trainingCount++;
              break;
            case 'MATCH':
              matchCount++;
              break;
            case 'MEETING':
              meetingCount++;
              break;
          }
        }
      });
      
      training.push(trainingCount);
      matches.push(matchCount);
      meetings.push(meetingCount);
    }
    
    const upcomingEventsByMonth = {
      labels: months,
      training,
      matches,
      meetings
    };
    
    return NextResponse.json({
      teamsMatchesStats,
      teamsPlayersCount,
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