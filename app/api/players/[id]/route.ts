import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';

// GET /api/players/[id] - получение игрока по ID
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

    // Проверка роли пользователя (ADMIN или COACH)
    const userRole = (session.user?.role || '').toUpperCase();
    if (!['ADMIN', 'COACH'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для просмотра данных игрока' },
        { status: 403 }
      );
    }

    const playerId = params.id;
    
    // Получаем игрока с включением связанных данных
    const player = await prisma.player.findUnique({
      where: {
        id: playerId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            profile: true
          }
        },
        teamPlayers: {
          where: { isActive: true },
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
    
    if (!player) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(player);
  } catch (error) {
    console.error('Ошибка при получении данных игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных игрока' },
      { status: 500 }
    );
  }
}

// PUT /api/players/[id] - обновление игрока
export async function PUT(
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
    
    // Проверка роли пользователя (только ADMIN)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для обновления данных игрока' },
        { status: 403 }
      );
    }
    
    const playerId = params.id;
    const data = await request.json();
    
    // Получаем текущего игрока
    const existingPlayer = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });
    
    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }
    
    // Проверяем, не меняется ли email на уже существующий
    if (data.email && data.email !== existingPlayer.user.email) {
      const userWithSameEmail = await prisma.user.findUnique({
        where: {
          email: data.email
        }
      });
      
      if (userWithSameEmail) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 400 }
        );
      }
    }
    
    // Обновляем игрока и связанные данные в транзакции
    const updatedPlayer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Обновляем данные пользователя
      if (data.email || data.password || data.firstName || data.lastName || data.phone !== undefined) {
        await tx.user.update({
          where: { id: existingPlayer.userId },
          data: {
            email: data.email || undefined,
            password: data.password || undefined, // Примечание: в реальном приложении пароль должен быть хеширован
            profile: {
              update: {
                firstName: data.firstName || undefined,
                lastName: data.lastName || undefined,
                phone: data.phone !== undefined ? data.phone : undefined
              }
            }
          }
        });
      }
      
      // Обновляем данные игрока
      const player = await tx.player.update({
        where: { id: playerId },
        data: {
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          position: data.position || undefined,
          height: data.height !== undefined ? data.height : undefined,
          weight: data.weight !== undefined ? data.weight : undefined,
          jerseyNumber: data.jerseyNumber !== undefined ? data.jerseyNumber : undefined
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          teamPlayers: {
            where: { isActive: true },
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
      
      // Если указана новая команда, обновляем связь игрока с командой
      if (data.teamId !== undefined) {
        // Если у игрока есть активные связи с командами
        if (player.teamPlayers && player.teamPlayers.length > 0) {
          const currentTeamPlayer = player.teamPlayers[0];
          
          // Если новая команда отличается от текущей, деактивируем текущую и создаем новую
          if (data.teamId && currentTeamPlayer.teamId !== data.teamId) {
            // Деактивируем текущую связь
            await tx.teamPlayer.update({
              where: { id: currentTeamPlayer.id },
              data: { isActive: false }
            });
            
            // Создаем новую связь
            await tx.teamPlayer.create({
              data: {
                teamId: data.teamId,
                playerId: playerId
              }
            });
          } else if (!data.teamId) {
            // Если команда не указана, деактивируем текущую связь
            await tx.teamPlayer.update({
              where: { id: currentTeamPlayer.id },
              data: { isActive: false }
            });
          }
        } else if (data.teamId) {
          // Если у игрока нет активных связей с командами, но указана новая команда
          await tx.teamPlayer.create({
            data: {
              teamId: data.teamId,
              playerId: playerId
            }
          });
        }
      }
      
      // Возвращаем обновленного игрока
      return player;
    });
    
    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Ошибка при обновлении игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении игрока' },
      { status: 500 }
    );
  }
}

// DELETE /api/players/[id] - удаление игрока
export async function DELETE(
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
    
    // Проверка роли пользователя (только ADMIN)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления игрока' },
        { status: 403 }
      );
    }
    
    const playerId = params.id;
    
    // Проверяем существование игрока
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true }
    });
    
    if (!player) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }
    
    // Вместо физического удаления деактивируем пользователя
    await prisma.user.update({
      where: { id: player.userId },
      data: { isActive: false }
    });
    
    return NextResponse.json({ message: 'Игрок успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении игрока' },
      { status: 500 }
    );
  }
} 