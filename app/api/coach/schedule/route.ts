export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/coach/schedule - получение расписания событий команд тренера
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
    
    // Получение параметров из URL
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const teamId = url.searchParams.get('teamId');
    const eventType = url.searchParams.get('eventType');
    
    // Поиск записи тренера
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
    
    // Получение команд, за которые отвечает тренер
    const teams = await prisma.team.findMany({
      where: {
        coachId: coach.id
      },
      select: {
        id: true
      }
    });
    
    const teamIds = teams.map(team => team.id);
    
    // Фильтр по датам
    let dateFilter = {};
    if (startDate) {
      dateFilter = {
        ...dateFilter,
        gte: new Date(startDate)
      };
    }
    if (endDate) {
      dateFilter = {
        ...dateFilter,
        lte: new Date(endDate)
      };
    }
    
    // Фильтр по команде
    let teamFilter: { teamId: string } | { teamId: { in: string[] } } = { teamId: { in: teamIds } };
    if (teamId) {
      teamFilter = { teamId };
    }
    
    // Фильтр по типу события
    let eventTypeFilter = {};
    if (eventType && eventType !== 'ALL') {
      eventTypeFilter = {
        eventType: eventType
      };
    }
    
    // Получение событий для команд тренера
    const events = await prisma.event.findMany({
      where: {
        ...eventTypeFilter,
        startTime: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        eventTeams: {
          some: teamFilter
        }
      },
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
    
    // Форматирование данных для ответа
    const formattedEvents = events.map(event => {
      const baseEvent: any = {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        location: event.location,
        status: event.status,
        teams: event.eventTeams.map(et => ({
          id: et.team.id,
          name: et.team.name
        }))
      };
      
      // Добавление информации о матче, если это матч
      if (event.eventType === 'MATCH' && event.match) {
        baseEvent.match = {
          id: event.match.id,
          homeTeam: event.match.homeTeam,
          awayTeam: event.match.awayTeam,
          homeScore: event.match.homeScore,
          awayScore: event.match.awayScore,
          status: event.match.status
        };
      }
      
      return baseEvent;
    });
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Ошибка при получении расписания:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении расписания' },
      { status: 500 }
    );
  }
}

// POST /api/coach/schedule - создание нового события в расписании
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
    
    // Поиск записи тренера
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
    
    // Получение данных из запроса
    const data = await request.json();
    
    // Проверка наличия необходимых полей
    if (!data.title || !data.eventType || !data.startTime || !data.endTime || !data.teamIds || data.teamIds.length === 0) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      );
    }
    
    // Проверка доступа тренера к указанным командам
    const teamsCheck = await prisma.team.findMany({
      where: {
        coachId: coach.id,
        id: {
          in: data.teamIds
        }
      },
      select: {
        id: true
      }
    });
    
    if (teamsCheck.length !== data.teamIds.length) {
      return NextResponse.json(
        { error: 'У вас нет доступа к некоторым из указанных команд' },
        { status: 403 }
      );
    }
    
    // Создание нового события
    const result = await prisma.$transaction(async (tx) => {
      // 1. Создание события
      const event = await tx.event.create({
        data: {
          title: data.title,
          description: data.description || null,
          eventType: data.eventType,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          location: data.location || null,
          status: 'SCHEDULED',
          // Связь с командами
          eventTeams: {
            create: data.teamIds.map((teamId: string) => ({
              teamId: teamId
            }))
          },
          // Связь с тренером
          eventCoaches: {
            create: {
              coachId: coach.id
            }
          }
        },
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
          }
        }
      });
      
      // 2. Создание записи матча (при необходимости)
      let match = null;
      if (data.eventType === 'MATCH' && data.homeTeamId && data.awayTeamId) {
        match = await tx.match.create({
          data: {
            eventId: event.id,
            homeTeamId: data.homeTeamId,
            awayTeamId: data.awayTeamId,
            status: 'SCHEDULED'
          },
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
        });
      }
      
      return { event, match };
    });
    
    // Форматирование ответа
    const response: any = {
      id: result.event.id,
      title: result.event.title,
      description: result.event.description,
      eventType: result.event.eventType,
      startTime: result.event.startTime.toISOString(),
      endTime: result.event.endTime.toISOString(),
      location: result.event.location,
      status: result.event.status,
      teams: result.event.eventTeams.map(et => ({
        id: et.team.id,
        name: et.team.name
      }))
    };
    
    // Добавление информации о матче
    if (result.match) {
      response.match = {
        id: result.match.id,
        homeTeam: result.match.homeTeam,
        awayTeam: result.match.awayTeam,
        status: result.match.status
      };
    }
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании события:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании события' },
      { status: 500 }
    );
  }
} 