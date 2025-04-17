import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { PrismaClient, Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';

// GET /api/players - получение списка игроков с фильтрацией и статусом для конкретной команды
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

    // Проверка роли пользователя (ADMIN или COACH)
    const userRole = (session.user?.role || '').toUpperCase();
    if (!['ADMIN', 'COACH'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для просмотра списка игроков' },
        { status: 403 }
      );
    }

    // Получение параметров запроса
    const { searchParams } = new URL(request.url);
    const excludeTeamId = searchParams.get('excludeTeamId'); // ID команды, игроков которой нужно ИСКЛЮЧИТЬ
    const searchTerm = searchParams.get('search'); // Для поиска по имени/email

    // Базовые условия фильтрации
    const whereCondition: Prisma.PlayerWhereInput = {};

    // Исключение игроков указанной команды
    if (excludeTeamId) {
      whereCondition.teamPlayers = {
        none: { // Игрок не должен иметь НИ ОДНОЙ связи с excludeTeamId
          teamId: excludeTeamId,
          // isActive: true // Убрал, чтобы исключить даже если связь неактивна
        }
      };
    }
    
    // Фильтр по поисковому запросу (имя, фамилия, email)
    if (searchTerm) {
      whereCondition.user = {
        OR: [
          {
            profile: {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };
    }
    
    // Получение игроков, не входящих в excludeTeamId, с данными об их текущих активных командах
    const players = await prisma.player.findMany({
      where: whereCondition,
      select: { // Явно выбираем нужные поля
        id: true,
        position: true,
        jerseyNumber: true,
        user: {
          select: {
            id: true,
            email: true,
            isActive: true, // Глобальный статус пользователя/игрока
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        // Получаем ВСЕ активные связи с командами, чтобы знать, свободен ли игрок
        teamPlayers: {
          where: {
            isActive: true // Только активные связи
          },
          select: {
            team: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        user: {
          profile: {
            lastName: 'asc'
          }
        }
      }
    });
    
    // Преобразование данных для удобства фронтенда
    const playersData = players.map(player => {
      const activeTeamPlayer = player.teamPlayers[0]; // Первая (и единственная) активная связь
      return {
        ...player,
        user: player.user, // Перенос user на верхний уровень для консистентности
        inTeam: false, // Эти игроки точно не в текущей команде (excludeTeamId)
        isActiveInTeam: null, // Не применимо, т.к. не в текущей команде
        globalIsActive: player.user.isActive, // Глобальный статус
        currentTeam: activeTeamPlayer ? activeTeamPlayer.team : null // Текущая активная команда (если есть)
      };
    });

    return NextResponse.json(playersData);
  } catch (error) {
    console.error('Ошибка при получении списка игроков:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка игроков' },
      { status: 500 }
    );
  }
}

// POST /api/players - создание нового игрока (только для администратора)
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

    // Проверка роли пользователя (только ADMIN)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      console.log('Access denied to create player: user role is', userRole);
      return NextResponse.json(
        { error: 'Недостаточно прав для создания игрока' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Получение ID роли PLAYER
    const playerRole = await prisma.role.findUnique({
      where: { name: 'PLAYER' }
    });
    
    if (!playerRole) {
      return NextResponse.json(
        { error: 'Роль PLAYER не найдена' },
        { status: 500 }
      );
    }
    
    // Проверка существования пользователя с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }
    
    // Создание игрока со всеми связанными данными в транзакции
    const newPlayer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Создание пользователя
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.password, // В реальном API должно быть хеширование пароля
          roleId: playerRole.id,
          profile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone
            }
          }
        }
      });
      
      // Создание игрока
      const player = await tx.player.create({
        data: {
          userId: user.id,
          birthDate: new Date(data.birthDate),
          position: data.position,
          height: data.height,
          weight: data.weight,
          jerseyNumber: data.jerseyNumber
        }
      });
      
      // Добавление игрока в команду при наличии указанной команды
      if (data.teamId) {
        await tx.teamPlayer.create({
          data: {
            teamId: data.teamId,
            playerId: player.id
          }
        });
      }
      
      return player;
    });
    
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании игрока' },
      { status: 500 }
    );
  }
} 