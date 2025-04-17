import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/coach/teams - получение списка команд тренера
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
    
    // Получаем команды, за которые отвечает тренер
    const teams = await prisma.team.findMany({
      where: {
        coachId: coach.id
      },
      include: {
        _count: {
          select: {
            teamPlayers: true
          }
        }
      }
    });
    
    // Форматируем данные для ответа
    const formattedTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      playersCount: team._count.teamPlayers,
      createdAt: team.createdAt,
      status: 'active',
      isActive: true,
      category: team.description ? 'Основная' : 'Дополнительная',
      stats: {
        gamesPlayed: team.gamesPlayed,
        wins: team.wins,
        losses: team.losses,
        draws: team.draws,
        pointsFor: team.pointsFor,
        pointsAgainst: team.pointsAgainst,
        winRate: team.gamesPlayed > 0 ? (team.wins / team.gamesPlayed * 100).toFixed(1) : '0'
      }
    }));
    
    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error('Ошибка при получении команд:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении команд' },
      { status: 500 }
    );
  }
}

// POST /api/coach/teams - создание новой команды
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
    
    // Получаем данные из запроса
    const data = await request.json();
    
    // Проверяем наличие необходимых полей
    if (!data.name) {
      return NextResponse.json(
        { error: 'Не указано название команды' },
        { status: 400 }
      );
    }
    
    // Создаем новую команду
    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description || null,
        coachId: coach.id
      },
      include: {
        _count: {
          select: {
            teamPlayers: true
          }
        }
      }
    });
    
    // Форматируем ответ
    const response = {
      id: team.id,
      name: team.name,
      description: team.description,
      playersCount: team._count.teamPlayers,
      createdAt: team.createdAt,
      status: 'active',
      isActive: true,
      category: team.description ? 'Основная' : 'Дополнительная',
      stats: {
        gamesPlayed: team.gamesPlayed,
        wins: team.wins,
        losses: team.losses,
        draws: team.draws,
        pointsFor: team.pointsFor,
        pointsAgainst: team.pointsAgainst,
        winRate: team.gamesPlayed > 0 ? (team.wins / team.gamesPlayed * 100).toFixed(1) : '0'
      }
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании команды' },
      { status: 500 }
    );
  }
} 