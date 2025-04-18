export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/player/teams - получение списка команд игрока
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
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: {
        playerId: player.id
      },
      include: {
        team: {
          include: {
            _count: {
              select: {
                teamPlayers: true
              }
            }
          }
        }
      }
    });
    
    // Форматируем данные для ответа
    const formattedTeams = teamPlayers.map(teamPlayer => ({
      id: teamPlayer.team.id,
      name: teamPlayer.team.name,
      description: teamPlayer.team.description,
      playersCount: teamPlayer.team._count.teamPlayers,
      createdAt: teamPlayer.team.createdAt,
      status: 'active',
      isActive: true,
      category: teamPlayer.team.description ? 'Основная' : 'Дополнительная',
      playerInfo: {
        id: player.id,
        position: "Игрок",
        number: 0
      }
    }));
    
    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error('Ошибка при получении команд игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении команд' },
      { status: 500 }
    );
  }
} 