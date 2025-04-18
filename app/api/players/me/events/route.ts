export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET /api/players/me/events - получение событий текущего игрока
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Проверка роли пользователя
    if (session.user.role !== 'PLAYER') {
      return NextResponse.json(
        { error: 'Доступ только для игроков' },
        { status: 403 }
      );
    }

    // Находим игрока по ID пользователя
    const player = await prisma.player.findFirst({
      where: {
        user: {
          id: session.user.id
        }
      }
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const typeFilter = searchParams.get('type');
    const dateFilter = searchParams.get('date');
    
    // Строим условия фильтрации
    const whereCondition: any = {
      // События, связанные с игроком
      eventPlayers: {
        some: {
          playerId: player.id
        }
      }
    };
    
    // Фильтр по типу события
    if (typeFilter) {
      whereCondition.eventType = typeFilter;
    }
    
    // Фильтр по поисковому запросу
    if (searchTerm) {
      whereCondition.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Фильтр по дате
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereCondition.startTime = {
        gte: filterDate,
        lt: nextDay
      };
    }
    
    // Получаем события
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
        eventPlayers: {
          where: {
            playerId: player.id
          },
          select: {
            attendance: true
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
    console.error('Ошибка при получении событий игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении событий игрока' },
      { status: 500 }
    );
  }
} 