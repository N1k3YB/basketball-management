import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events - получение списка событий
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

    // Получение параметров запроса
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const eventType = searchParams.get('type');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const teamId = searchParams.get('teamId');
    
    // Построение условий фильтрации
    const whereCondition: any = {};
    
    // Фильтр по типу события
    if (eventType) {
      whereCondition.eventType = eventType;
    }
    
    // Фильтр по диапазону дат
    if (fromDate || toDate) {
      whereCondition.startTime = {};
      
      if (fromDate) {
        whereCondition.startTime.gte = new Date(fromDate);
      }
      
      if (toDate) {
        whereCondition.startTime.lte = new Date(toDate);
      }
    }
    
    // Фильтр по команде
    if (teamId) {
      whereCondition.eventTeams = {
        some: {
          teamId
        }
      };
    }
    
    // Фильтр по поисковому запросу
    if (searchTerm) {
      whereCondition.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Ограничения по ролям - тренеры и игроки видят только свои события
    const userRole = (session.user?.role || '').toUpperCase();
    
    if (userRole === 'COACH' && session.user.coachId) {
      // Тренер видит события своих команд
      whereCondition.OR = [
        {
          eventCoaches: {
            some: {
              coachId: session.user.coachId
            }
          }
        },
        {
          eventTeams: {
            some: {
              team: {
                coachId: session.user.coachId
              }
            }
          }
        }
      ];
    } else if (userRole === 'PLAYER' && session.user.playerId) {
      // Игрок видит события своих команд
      whereCondition.eventPlayers = {
        some: {
          playerId: session.user.playerId
        }
      };
    }
    
    // Получение событий с включением связанных данных
    const events = await prisma.event.findMany({
      where: whereCondition,
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
        },
        match: {
          include: {
            homeTeam: {
              select: {
                id: true,
                name: true
              }
            },
            awayTeam: {
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
      }
    });
    
    return NextResponse.json(events);
  } catch (error) {
    console.error('Ошибка при получении событий:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении событий' },
      { status: 500 }
    );
  }
}

// POST /api/events - создание нового события
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
    
    // Проверка роли пользователя (только ADMIN и COACH)
    const userRole = (session.user?.role || '').toUpperCase();
    if (!['ADMIN', 'COACH'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для создания события' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Создание нового события
    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        location: data.location,
        // Добавление связей с командами
        eventTeams: {
          create: data.teamIds ? data.teamIds.map((teamId: string) => ({
            teamId
          })) : []
        },
        // Создание записи матча для события типа "матч"
        ...(data.eventType === 'MATCH' && data.match ? {
          match: {
            create: {
              homeScore: data.match.homeScore || 0,
              awayScore: data.match.awayScore || 0,
              status: data.match.status || 'SCHEDULED',
              // Использование объекта для связи с домашней командой
              homeTeam: {
                connect: {
                  id: data.match.homeTeamId
                }
              },
              // Использование отдельного ID для гостевой команды
              awayTeam: {
                connect: {
                  id: data.match.awayTeamId || data.match.homeTeamId
                }
              }
            }
          }
        } : {}),
        
        // Сохранение названия внешней команды в описании события
        ...(data.eventType === 'MATCH' && data.match && data.match.awayTeamName ? {
          description: data.description 
            ? `${data.description}\nГостевая команда: ${data.match.awayTeamName}`
            : `Гостевая команда: ${data.match.awayTeamName}`
        } : {})
      },
      include: {
        eventTeams: {
          include: {
            team: true
          }
        },
        match: true
      }
    });
    
    // Добавление игроков команды к событию
    if (data.teamIds && data.teamIds.length > 0) {
      for (const teamId of data.teamIds) {
        const teamPlayers = await prisma.teamPlayer.findMany({
          where: {
            teamId,
            isActive: true
          },
          select: {
            playerId: true
          }
        });
        
        // Добавление игроков к событию
        if (teamPlayers.length > 0) {
          await prisma.eventPlayer.createMany({
            data: teamPlayers.map(tp => ({
              eventId: newEvent.id,
              playerId: tp.playerId,
              attendance: 'PLANNED'
            })),
            skipDuplicates: true
          });
        }
      }
      
      // Инициализация статистики для матча
      if (data.eventType === 'MATCH' && data.syncData && 'match' in newEvent && newEvent.match) {
        // Инициализация статистики игроков для матча
        const matchId = newEvent.match.id;
        const homeTeamPlayers = await prisma.teamPlayer.findMany({
          where: {
            teamId: data.match.homeTeamId,
            isActive: true
          },
          select: {
            playerId: true
          }
        });
        
        // Создание начальной статистики для игроков
        if (homeTeamPlayers.length > 0) {
          await prisma.playerStat.createMany({
            data: homeTeamPlayers.map(player => ({
              matchId,
              playerId: player.playerId,
              points: 0,
              rebounds: 0,
              assists: 0,
              steals: 0,
              blocks: 0,
              turnovers: 0,
              minutesPlayed: 0,
              fieldGoalsMade: 0,
              fieldGoalsAttempted: 0,
              threePointersMade: 0,
              threePointersAttempted: 0,
              freeThrowsMade: 0,
              freeThrowsAttempted: 0
            })),
            skipDuplicates: true
          });
        }
      }
    }
    
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании события:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании события' },
      { status: 500 }
    );
  }
} 