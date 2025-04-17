import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/profile/[id] - получение публичного профиля пользователя
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

    const userId = params.id;
    
    // Получаем пользователя с включением базовых связанных данных для публичного просмотра
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        role: true,
        profile: true,
        player: {
          select: {
            id: true,
            position: true,
            jerseyNumber: true,
            height: true,
            weight: true,
            teamPlayers: {
              where: {
                isActive: true
              },
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
        },
        coach: {
          select: {
            id: true,
            specialization: true,
            experience: true,
            teams: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    // Скрываем пароль и другие конфиденциальные данные
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при получении публичного профиля пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных пользователя' },
      { status: 500 }
    );
  }
} 