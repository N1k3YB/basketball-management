export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/dashboard/charts - получение данных для графиков на дашборде администратора
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка аутентификации
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    // Проверка роли пользователя
    const userRole = session.user.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }
    
    // Получаем все команды
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    const teamIds = teams.map(team => team.id);
    
    // Получаем статистику матчей по командам
    const teamsMatchesStats = await Promise.all(
      teams.map(async (team) => {
        const matches = await prisma.match.findMany({
          where: {
            OR: [
              { 
                homeTeam: {
                  id: team.id
                }
              },
              { 
                awayTeam: {
                  id: team.id
                }
              }
            ],
            status: 'COMPLETED',
            homeScore: { not: null },
            awayScore: { not: null }
          },
          include: {
            homeTeam: true,
            awayTeam: true
          }
        });
        
        const wins = matches.filter(match => {
          if (match.homeScore === null || match.awayScore === null) return false;
          if (match.homeTeam.id === team.id) {
            return match.homeScore > match.awayScore;
          } else if (match.awayTeam.id === team.id) {
            return match.awayScore > match.homeScore;
          }
          return false;
        }).length;
        
        const losses = matches.filter(match => {
          if (match.homeScore === null || match.awayScore === null) return false;
          if (match.homeTeam.id === team.id) {
            return match.homeScore < match.awayScore;
          } else if (match.awayTeam.id === team.id) {
            return match.awayScore < match.homeScore;
          }
          return false;
        }).length;
        
        const draws = matches.filter(match => {
          if (match.homeScore === null || match.awayScore === null) return false;
          return match.homeScore === match.awayScore;
        }).length;
        
        return {
          teamName: team.name,
          wins,
          losses,
          draws
        };
      })
    );
    
    // Получаем количество игроков по командам
    const teamsPlayersCount = await Promise.all(
      teams.map(async (team) => {
        const count = await prisma.teamPlayer.count({
          where: {
            teamId: team.id,
            isActive: true
          }
        });
        
        return {
          teamName: team.name,
          count
        };
      })
    );
    
    // Получаем статистику событий по месяцам
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);
    
    const events = await prisma.event.findMany({
      where: {
        startTime: {
          gte: now,
          lte: sixMonthsFromNow
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
    
    // Форматируем данные для графиков
    const chartData = {
      teamsMatchesStats: {
        labels: teamsMatchesStats.map(stat => stat.teamName),
        wins: teamsMatchesStats.map(stat => stat.wins),
        losses: teamsMatchesStats.map(stat => stat.losses),
        draws: teamsMatchesStats.map(stat => stat.draws)
      },
      teamsPlayersCount: {
        labels: teamsPlayersCount.map(stat => stat.teamName),
        playersCount: teamsPlayersCount.map(stat => stat.count)
      },
      upcomingEventsByMonth: {
        labels: months,
        training: training,
        matches: matches,
        meetings: meetings
      }
    };
    
    return NextResponse.json(chartData);
    
  } catch (error) {
    console.error('Ошибка при получении данных для графиков:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных для графиков' },
      { status: 500 }
    );
  }
} 