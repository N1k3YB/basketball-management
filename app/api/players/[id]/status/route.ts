export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/players/[id]/status - изменение статуса активности игрока
export async function PATCH(
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
    
    // Проверка роли пользователя - администратор или тренер
    const userRole = (session.user?.role || '').toUpperCase();
    if (!['ADMIN', 'COACH'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для изменения статуса игрока' },
        { status: 403 }
      );
    }
    
    const playerId = params.id;
    const data = await request.json();
    const { isActive } = data;
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Некорректные данные. Необходимо указать статус активности (isActive)' },
        { status: 400 }
      );
    }
    
    // Если пользователь тренер, проверяем, принадлежит ли игрок его команде
    if (userRole === 'COACH') {
      try {
        // Находим команды тренера
        const coachTeams = await prisma.team.findMany({
          where: {
            coachId: session.user.coachId,
          },
          select: {
            id: true
          }
        });
        
        if (coachTeams.length === 0) {
          return NextResponse.json(
            { error: 'У вас нет команд под управлением' },
            { status: 403 }
          );
        }
        
        const coachTeamIds = coachTeams.map(team => team.id);
        
        // Проверяем, есть ли игрок в команде этого тренера
        const playerInCoachTeam = await prisma.teamPlayer.findFirst({
          where: {
            playerId,
            teamId: {
              in: coachTeamIds
            },
          }
        });
        
        if (!playerInCoachTeam) {
          return NextResponse.json(
            { error: 'У вас нет прав на управление этим игроком. Игрок должен быть в вашей команде.' },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('Ошибка при проверке прав тренера:', error);
        return NextResponse.json(
          { error: 'Ошибка при проверке прав доступа' },
          { status: 500 }
        );
      }
    }
    
    // Получаем данные игрока, чтобы узнать ID пользователя
    const player = await prisma.player.findUnique({
      where: {
        id: playerId
      },
      select: {
        userId: true
      }
    });
    
    if (!player) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }
    
    // Обновляем статус активности пользователя
    const updatedUser = await prisma.user.update({
      where: {
        id: player.userId
      },
      data: {
        isActive
      }
    });
    
    return NextResponse.json({ 
      success: true,
      isActive: updatedUser.isActive 
    });
  } catch (error) {
    console.error('Ошибка при изменении статуса игрока:', error);
    return NextResponse.json(
      { error: 'Ошибка при изменении статуса игрока' },
      { status: 500 }
    );
  }
} 