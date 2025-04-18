export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TeamPlayer, Player } from '@prisma/client';

// GET /api/teams/[id] - получить информацию о команде
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка аутентификации
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    const id = params.id;
    const userRole = session.user.role?.toUpperCase();
    
    // Получение команды
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        coach: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        teamPlayers: {
          include: {
            player: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 });
    }
    
    // Проверка прав доступа в зависимости от роли
    if (userRole === 'ADMIN') {
      // Администраторы имеют доступ ко всем командам
      const formattedTeam = {
        ...team,
        players: team.teamPlayers?.map((tp) => tp.player) || [],
        isCoachTeam: true // Администраторы имеют полный доступ
      };
      return NextResponse.json(formattedTeam);
    } else if (userRole === 'COACH') {
      // Тренеры имеют доступ только к своим командам
      const coach = await prisma.coach.findFirst({
        where: { userId: session.user.id }
      });
      
      if (!coach) {
        return NextResponse.json({ error: 'Тренер не найден' }, { status: 404 });
      }
      
      const isCoachTeam = team.coachId === coach.id;
      
      // Для своих команд тренер получает полную информацию
      const formattedTeam = {
        ...team,
        players: team.teamPlayers?.map((tp) => tp.player) || [],
        isCoachTeam // Признак, что это команда текущего тренера
      };
      
      // Возврат информации о команде даже если это не команда тренера
      return NextResponse.json(formattedTeam);
    } else if (userRole === 'PLAYER') {
      // Игроки имеют доступ только к командам, в которых они участвуют
      const player = await prisma.player.findFirst({
        where: { userId: session.user.id }
      });
      
      if (!player) {
        return NextResponse.json({ error: 'Игрок не найден' }, { status: 404 });
      }
      
      const isPlayerInTeam = team.teamPlayers.some((tp) => tp.playerId === player.id);
      
      if (!isPlayerInTeam) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
      }
      
      const formattedTeam = {
        ...team,
        players: team.teamPlayers?.map((tp) => tp.player) || []
      };
      return NextResponse.json(formattedTeam);
    } else {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }
  } catch (error) {
    console.error('Ошибка при получении информации о команде:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации о команде' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - обновить команду
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка аутентификации
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    const id = params.id;
    const userRole = session.user.role?.toUpperCase();
    
    // Проверка прав доступа
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав для редактирования команды' }, { status: 403 });
    }
    
    // Получение данных из запроса
    const { name, description, coachId, playerIds } = await req.json();
    
    // Валидация
    if (!name) {
      return NextResponse.json({ error: 'Название команды обязательно' }, { status: 400 });
    }
    
    // Проверка существования команды
    const existingTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        teamPlayers: true
      }
    });
    
    if (!existingTeam) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 });
    }
    
    // Проверка, что другая команда не использует то же имя
    const teamWithSameName = await prisma.team.findFirst({
      where: {
        name,
        id: { not: id }
      }
    });
    
    if (teamWithSameName) {
      return NextResponse.json({ error: 'Команда с таким названием уже существует' }, { status: 400 });
    }
    
    // Базовое обновление данных команды
    const updateData: any = {
      name,
      description,
    };
    
    // Обновление тренера, если указан
    if (coachId) {
      updateData.coach = { connect: { id: coachId } };
    } else {
      updateData.coach = { disconnect: true };
    }
    
    // Обновление команды без изменения игроков
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        coach: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        teamPlayers: {
          include: {
            player: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // Если переданы ID игроков, обновляем состав команды
    if (playerIds && Array.isArray(playerIds)) {
      // Получение текущих игроков команды
      const currentPlayerIds = existingTeam.teamPlayers.map(tp => tp.playerId);
      
      // Определение игроков для удаления и добавления
      const playerIdsToRemove = currentPlayerIds.filter((id: string) => !playerIds.includes(id));
      const playerIdsToAdd = playerIds.filter((id: string) => !currentPlayerIds.includes(id));
      
      // Удаление связей с игроками, которых нужно убрать из команды
      if (playerIdsToRemove.length > 0) {
        await prisma.teamPlayer.deleteMany({
          where: {
            teamId: id,
            playerId: { in: playerIdsToRemove }
          }
        });
      }
      
      // Добавление новых игроков в команду
      if (playerIdsToAdd.length > 0) {
        await prisma.teamPlayer.createMany({
          data: playerIdsToAdd.map((playerId: string) => ({
            teamId: id,
            playerId,
            isActive: true
          }))
        });
      }
      
      // Получение обновленной команды
      const refreshedTeam = await prisma.team.findUnique({
        where: { id },
        include: {
          coach: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          },
          teamPlayers: {
            include: {
              player: {
                include: {
                  user: {
                    include: {
                      profile: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      if (refreshedTeam) {
        const formattedTeam = {
          ...refreshedTeam,
          players: refreshedTeam.teamPlayers?.map((tp) => tp.player) || []
        };
        return NextResponse.json(formattedTeam);
      }
    }
    
    // Если игроки не обновлялись
    const formattedTeam = {
      ...updatedTeam,
      players: updatedTeam.teamPlayers?.map((tp) => tp.player) || []
    };
    return NextResponse.json(formattedTeam);
  } catch (error) {
    console.error('Ошибка при обновлении команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении команды' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - удалить команду
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка аутентификации
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    const id = params.id;
    const userRole = session.user.role?.toUpperCase();
    
    // Проверка прав доступа
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав для удаления команды' }, { status: 403 });
    }
    
    // Проверка существования команды
    const existingTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        teamPlayers: true
      }
    });
    
    if (!existingTeam) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 });
    }

    // Начало транзакции для обеспечения атомарности операций
    await prisma.$transaction(async (tx) => {
      // 1. Удаление всех записей из TeamPlayers (игроки команды)
      await tx.teamPlayer.deleteMany({
        where: { teamId: id }
      });

      // 3. Удаление всех связанных матчей (где команда домашняя или гостевая)
      await tx.match.deleteMany({
        where: {
          OR: [
            { 
              homeTeam: {
                id: id
              }
            },
            { 
              awayTeam: {
                id: id
              }
            }
          ]
        }
      });

      // 4. Удаление самой команды после удаления всех связанных записей
      await tx.team.delete({
        where: { id }
      });
    });
    
    return NextResponse.json({ message: 'Команда и все связанные с ней данные успешно удалены' });
  } catch (error) {
    console.error('Ошибка при удалении команды:', error);
    
    // Возвращаем более подробную информацию об ошибке
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return NextResponse.json(
      { error: 'Ошибка при удалении команды', details: errorMessage },
      { status: 500 }
    );
  }
} 