export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/teams/[id]/players/[playerId] - изменение статуса игрока в команде (активен/неактивен)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; playerId: string } }
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
    
    // Проверка роли пользователя (Администратор или Тренер)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'COACH') {
      return NextResponse.json(
        { error: 'Недостаточно прав для изменения статуса игрока. Только администратор или тренер может выполнять эту операцию.' },
        { status: 403 }
      );
    }
    
    const { id: teamId, playerId } = params;
    const { isActive } = await request.json(); // Получаем новый статус из тела запроса

    // Валидация isActive
    if (typeof isActive !== 'boolean') {
        return NextResponse.json(
            { error: 'Неверный формат данных для статуса isActive' },
            { status: 400 }
        );
    }

    // Если пользователь тренер, проверяем его права на эту команду
    if (userRole === 'COACH') {
      const teamBelongsToCoach = await prisma.team.findFirst({
        where: {
          id: teamId,
          coachId: session.user.coachId // Убедитесь, что coachId есть в сессии
        }
      });
      
      if (!teamBelongsToCoach) {
        return NextResponse.json(
          { error: 'У вас нет прав на управление этой командой' },
          { status: 403 }
        );
      }
    }
    
    // Находим связь между игроком и командой (независимо от текущего статуса isActive)
    const teamPlayer = await prisma.teamPlayer.findFirst({
      where: {
        teamId,
        playerId,
      }
    });
    
    if (!teamPlayer) {
      return NextResponse.json(
        { error: 'Игрок не найден в этой команде' },
        { status: 404 }
      );
    }
    
    // Обновляем статус isActive игрока в команде
    const updatedTeamPlayer = await prisma.teamPlayer.update({
        where: { id: teamPlayer.id },
        data: { isActive: isActive }
    });
    
    return NextResponse.json(updatedTeamPlayer); // Возвращаем обновленную запись

  } catch (error) {
    console.error('Ошибка при изменении статуса игрока в команде:', error);
    return NextResponse.json(
      { error: 'Ошибка при изменении статуса игрока в команде' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/players/[playerId] - полное удаление игрока из команды
export async function DELETE(
  request: Request, // request не используется, но нужен для сигнатуры
  { params }: { params: { id: string; playerId: string } }
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
    
    // Проверка роли пользователя (Администратор или Тренер)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'COACH') {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления игрока из команды. Только администратор или тренер может выполнять эту операцию.' },
        { status: 403 }
      );
    }
    
    const { id: teamId, playerId } = params;
    
    // Если пользователь тренер, проверяем его права на эту команду
    if (userRole === 'COACH') {
      const teamBelongsToCoach = await prisma.team.findFirst({
        where: {
          id: teamId,
          coachId: session.user.coachId // Убедитесь, что coachId есть в сессии
        }
      });
      
      if (!teamBelongsToCoach) {
        return NextResponse.json(
          { error: 'У вас нет прав на управление этой командой' },
          { status: 403 }
        );
      }
    }
    
    // Находим связь между игроком и командой (независимо от статуса isActive)
    const teamPlayer = await prisma.teamPlayer.findFirst({
      where: {
        teamId,
        playerId,
      }
    });
    
    if (!teamPlayer) {
      // Если связи нет, возможно, игрок уже удален. Возвращаем успех или 404 по желанию.
      // Вернем 404 для ясности, что удалять было нечего.
      return NextResponse.json(
        { error: 'Игрок не найден в команде для удаления' },
        { status: 404 }
      );
    }
    
    // Удаляем связь игрока с командой
    await prisma.teamPlayer.delete({
      where: { id: teamPlayer.id }
    });
    
    return NextResponse.json({ success: true, message: 'Игрок успешно удален из команды' });

  } catch (error) {
    console.error('Ошибка при удалении игрока из команды:', error);
    // Проверка на 특정 ошибки Prisma, например, если запись не найдена при удалении
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return NextResponse.json(
            { error: 'Запись для удаления не найдена. Возможно, игрок уже удален.' },
            { status: 404 }
        );
    }
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при удалении игрока из команды' },
      { status: 500 }
    );
  }
} 