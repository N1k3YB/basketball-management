import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Интерфейс для активности
interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    role: string;
    profile?: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
}

// GET /api/admin/dashboard - получение данных для панели администратора
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

    // Отладка сессии
    console.log('Session in admin dashboard API:', session);
    
    // Проверка роли пользователя (приводим к верхнему регистру для надежности)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      console.log('Access denied: user role is', userRole);
      return NextResponse.json(
        { error: 'Доступ только для администраторов' },
        { status: 403 }
      );
    }

    // Получаем количество пользователей
    const totalUsers = await prisma.user.count();

    // Получаем количество команд
    const totalTeams = await prisma.team.count();

    // Получаем количество предстоящих событий
    const now = new Date();
    const upcomingEvents = await prisma.event.count({
      where: {
        startTime: {
          gte: now
        }
      }
    });

    // Получаем количество активных игроков
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true
      }
    });

    // Получаем последние действия (активности)
    let recentActivities = [];
    try {
      recentActivities = await prisma.activity.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });
    } catch (activityError) {
      console.error('Ошибка при получении активностей:', activityError);
      // Продолжаем выполнение, просто с пустым массивом активностей
    }

    // Форматируем данные о последних действиях
    const formattedActivities = recentActivities.map((activity: Activity) => ({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      timestamp: activity.createdAt.toISOString(),
      user: {
        id: activity.user.id,
        name: `${activity.user.profile?.firstName || ''} ${activity.user.profile?.lastName || ''}`,
        email: activity.user.email,
        role: activity.user.role
      }
    }));

    // Возвращаем данные для дашборда
    return NextResponse.json({
      stats: {
        totalUsers,
        totalTeams,
        upcomingEvents,
        activeUsers
      },
      recentActivities: formattedActivities
    });
  } catch (error) {
    console.error('Ошибка при получении данных для дашборда администратора:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных для дашборда администратора' },
      { status: 500 }
    );
  }
} 