import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Определение типа статуса посещения
type AttendanceStatus = 'PLANNED' | 'ATTENDED' | 'ABSENT' | 'EXCUSED';

// PUT /api/events/[id]/attendance - обновление статуса посещения события игроком
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

    // Проверка роли пользователя (только PLAYER может отмечать свое посещение)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'PLAYER') {
      console.log('Access denied to update attendance: user role is', userRole);
      return NextResponse.json(
        { error: 'Недостаточно прав для изменения посещаемости' },
        { status: 403 }
      );
    }

    const eventId = params.id;
    const { status } = await request.json();
    
    // Проверяем, что статус корректный
    const validStatuses: AttendanceStatus[] = ['PLANNED', 'ATTENDED', 'ABSENT', 'EXCUSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Некорректный статус посещения' },
        { status: 400 }
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
    
    // Проверяем, существует ли событие
    const event = await prisma.event.findUnique({
      where: {
        id: eventId
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Событие не найдено' },
        { status: 404 }
      );
    }
    
    // Проверяем, связан ли игрок с этим событием
    const eventPlayer = await prisma.eventPlayer.findFirst({
      where: {
        eventId,
        playerId: player.id
      }
    });
    
    if (!eventPlayer) {
      return NextResponse.json(
        { error: 'Вы не связаны с этим событием' },
        { status: 403 }
      );
    }
    
    // Обновляем статус посещения
    const updatedEventPlayer = await prisma.eventPlayer.update({
      where: {
        id: eventPlayer.id
      },
      data: {
        attendance: status
      }
    });
    
    return NextResponse.json(updatedEventPlayer);
  } catch (error) {
    console.error('Ошибка при обновлении статуса посещения:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении статуса посещения' },
      { status: 500 }
    );
  }
} 