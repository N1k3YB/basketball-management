import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/teams/[id]/players - получение списка игроков в команде
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const teamId = params.id;
    
    // Получаем ВСЕХ игроков, связанных с командой (активных и неактивных)
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: {
        teamId, // Убираем фильтр isActive: true
      },
      select: { // Явно выбираем нужные поля
        id: true,
        isActive: true, // Статус связи игрока с ЭТОЙ командой
        player: {
          select: {
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
            }
          }
        }
      },
      orderBy: {
        player: {
          user: {
            profile: {
              lastName: 'asc'
            }
          }
        }
      }
    });
    
    // Преобразуем данные для удобства фронтенда
    const playersData = teamPlayers.map(tp => ({
      ...tp.player, // Берем данные игрока (id, position, user...)
      inTeam: true, // Явно указываем, что он в ЭТОЙ команде
      isActiveInTeam: tp.isActive, // Статус в этой команде
      globalIsActive: tp.player.user.isActive // Глобальный статус
    }));

    return NextResponse.json(playersData);
  } catch (error) {
    console.error('Ошибка при получении игроков команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении игроков команды' },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/players - добавление игрока в команду
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }
    
    // Проверка роли пользователя - только администратор может добавлять игроков
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'COACH') {
      return NextResponse.json(
        { error: 'Недостаточно прав для добавления игроков в команду. Только администратор или тренер может выполнять эту операцию.' },
        { status: 403 }
      );
    }
    
    const teamId = params.id;
    const data = await request.json();
    const { playerId } = data;
    
    // Если пользователь тренер, проверяем, принадлежит ли ему эта команда
    if (userRole === 'COACH') {
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          coachId: session.user.coachId
        }
      });
      
      if (!team) {
        return NextResponse.json(
          { error: 'У вас нет прав на управление этой командой' },
          { status: 403 }
        );
      }
    }
    
    // Получаем данные игрока для проверки его активности и нахождения в другой команде
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            isActive: true,
            id: true
          }
        }
      }
    });
    
    if (!player) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }
    
    // Проверяем, находится ли игрок уже в другой команде
    const playerInOtherTeam = await prisma.teamPlayer.findFirst({
      where: {
        playerId,
        isActive: true,
        NOT: {
          teamId
        }
      },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Теперь тренер может добавлять как неактивных игроков, так и свободных (активных, но не в команде)
    if (userRole === 'COACH' && player.user.isActive && playerInOtherTeam) {
      return NextResponse.json(
        { error: `Тренер может добавлять только свободных или неактивных игроков. Этот игрок уже в команде "${playerInOtherTeam.team.name}"` },
        { status: 403 }
      );
    }
    
    // Проверяем, существует ли НЕАКТИВНАЯ связь между игроком и командой
    const existingInactiveTeamPlayer = await prisma.teamPlayer.findFirst({
      where: {
        teamId,
        playerId,
        isActive: false // Ищем именно неактивную связь
      }
    });
    
    let teamPlayer;
    
    if (existingInactiveTeamPlayer) {
      // Если неактивная связь существует, обновляем ее до активной
      teamPlayer = await prisma.teamPlayer.update({
        where: { 
          id: existingInactiveTeamPlayer.id // Обновляем по ID найденной неактивной связи
        },
        data: { 
          isActive: true 
        },
        include: { // Включаем связанные данные, как при создании
          player: {
            include: {
              user: {
                select: {
                  profile: true
                }
              }
            }
          },
          team: true
        }
      });
    } else {
      // Если неактивной связи нет (и активной тоже, проверено ранее),
      // создаем новую активную связь
      teamPlayer = await prisma.teamPlayer.create({
        data: {
          teamId,
          playerId,
          isActive: true
        },
        include: {
          player: {
            include: {
              user: {
                select: {
                  profile: true
                }
              }
            }
          },
          team: true
        }
      });
    }
    
    // Если игрок был неактивным, активируем его
    if (!player.user.isActive) {
      await prisma.user.update({
        where: { id: player.userId },
        data: { isActive: true }
      });
    }
    
    return NextResponse.json(teamPlayer, { status: 201 });
  } catch (error) {
    console.error('Ошибка при добавлении игрока в команду:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении игрока в команду' },
      { status: 500 }
    );
  }
} 