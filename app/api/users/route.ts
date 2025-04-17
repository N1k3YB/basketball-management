import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcrypt';

// GET /api/users - получение списка пользователей
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
    console.log('Session in users API:', session);
    
    // Проверка роли пользователя (приводим к верхнему регистру для надежности)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      console.log('Access denied to users list: user role is', userRole);
      return NextResponse.json(
        { error: 'Недостаточно прав для просмотра списка пользователей' },
        { status: 403 }
      );
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const searchTerm = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    
    // Строим условие фильтрации
    const whereCondition: any = {};
    
    // Фильтр по роли
    if (roleFilter) {
      whereCondition.role = {
        name: roleFilter
      };
    }
    
    // Фильтр по активности
    if (isActive !== null) {
      whereCondition.isActive = isActive === 'true';
    }
    
    // Поиск по имени, фамилии, email
    if (searchTerm) {
      whereCondition.OR = [
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          profile: {
            OR: [
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ];
    }
    
    // Получаем пользователей с включением связанных данных
    const users = await prisma.user.findMany({
      where: whereCondition,
      include: {
        role: true,
        profile: true,
        player: true,
        coach: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Скрываем пароли из ответа
    const safeUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка пользователей' },
      { status: 500 }
    );
  }
}

// POST /api/users - создание нового пользователя
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
      return NextResponse.json(
        { error: 'Недостаточно прав для создания пользователя' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Проверка существования email
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }
    
    // Хешируем пароль
    const hashedPassword = await hash(data.password, 10);
    
    // Создаем нового пользователя
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        roleId: data.roleId,
        isActive: true,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            address: data.address
          }
        },
        // Если роль "PLAYER", создаем запись игрока
        ...(data.playerData && {
          player: {
            create: {
              birthDate: new Date(data.playerData.birthDate),
              height: data.playerData.height,
              weight: data.playerData.weight,
              position: data.playerData.position,
              jerseyNumber: data.playerData.jerseyNumber
            }
          }
        }),
        // Если роль "COACH", создаем запись тренера
        ...(data.coachData && {
          coach: {
            create: {
              specialization: data.coachData.specialization,
              experience: data.coachData.experience
            }
          }
        })
      },
      include: {
        role: true,
        profile: true,
        player: true,
        coach: true
      }
    });
    
    // Скрываем пароль из ответа
    const { password, ...userWithoutPassword } = newUser;
    
    // Создаем запись активности
    // await prisma.activity.create({
    //   data: {
    //     userId: session.user.id,
    //     action: 'CREATE',
    //     entityType: 'USER',
    //     entityId: newUser.id,
    //     details: {
    //       email: newUser.email,
    //       role: newUser.role.name
    //     }
    //   }
    // });
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании пользователя' },
      { status: 500 }
    );
  }
} 