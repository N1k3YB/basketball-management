import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcrypt';

// GET /api/users/[id] - получение пользователя по ID
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

    // Отладка сессии
    console.log('Session in single user API:', session);
    
    // Проверка роли пользователя (приведение к верхнему регистру для надежности)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && session.user.id !== params.id) {
      console.log('Access denied to user details: user role is', userRole);
      return NextResponse.json(
        { error: 'Недостаточно прав для просмотра данных пользователя' },
        { status: 403 }
      );
    }

    const userId = params.id;
    
    // Получение пользователя с включением связанных данных
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        role: true,
        profile: true,
        player: {
          include: {
            teamPlayers: {
              where: {
                isActive: true
              },
              include: {
                team: true
              }
            }
          }
        },
        coach: {
          include: {
            teams: true
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
    
    // Скрытие пароля из ответа
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных пользователя' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - обновление пользователя
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
    
    // Проверка роли пользователя (только ADMIN и сам пользователь)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'Недостаточно прав для обновления данных пользователя' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    const data = await request.json();
    
    // Получение текущего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        player: true,
        coach: true
      }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    // Проверка на существование email
    if (data.email && data.email !== existingUser.email) {
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
    
    // Подготовка данных для обновления
    const updateData: any = {};
    
    // Обновление основных данных
    if (data.email) updateData.email = data.email;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.roleId && userRole === 'ADMIN') updateData.roleId = data.roleId;
    
    // Хеширование нового пароля
    if (data.password) {
      updateData.password = await hash(data.password, 10);
    }
    
    // Обновление профиля при наличии изменений
    if (
      data.firstName || 
      data.lastName || 
      data.phone !== undefined || 
      data.address !== undefined ||
      data.avatar !== undefined
    ) {
      updateData.profile = {
        update: {
          firstName: data.firstName || existingUser.profile?.firstName,
          lastName: data.lastName || existingUser.profile?.lastName,
          phone: data.phone !== undefined ? data.phone : existingUser.profile?.phone,
          address: data.address !== undefined ? data.address : existingUser.profile?.address,
          avatar: data.avatar !== undefined ? data.avatar : existingUser.profile?.avatar
        }
      };
    }
    
    // Если пользователь - игрок и есть данные игрока
    if (existingUser.player && data.playerData) {
      updateData.player = {
        update: {
          birthDate: data.playerData.birthDate ? new Date(data.playerData.birthDate) : existingUser.player.birthDate,
          height: data.playerData.height !== undefined ? data.playerData.height : existingUser.player.height,
          weight: data.playerData.weight !== undefined ? data.playerData.weight : existingUser.player.weight,
          position: data.playerData.position || existingUser.player.position,
          jerseyNumber: data.playerData.jerseyNumber !== undefined ? data.playerData.jerseyNumber : existingUser.player.jerseyNumber
        }
      };
    }
    
    // Если пользователь - тренер и есть данные тренера
    if (existingUser.coach && data.coachData) {
      updateData.coach = {
        update: {
          specialization: data.coachData.specialization !== undefined ? data.coachData.specialization : existingUser.coach.specialization,
          experience: data.coachData.experience !== undefined ? data.coachData.experience : existingUser.coach.experience
        }
      };
    }
    
    // Обновление пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
        profile: true,
        player: true,
        coach: true
      }
    });
    
    // Скрытие пароля из ответа
    const { password, ...userWithoutPassword } = updatedUser;
    
    // Создаем запись активности
    // await prisma.activity.create({
    //   data: {
    //     userId: session.user.id,
    //     action: 'UPDATE',
    //     entityType: 'USER',
    //     entityId: userId,
    //     details: {
    //       email: updatedUser.email,
    //       role: updatedUser.role.name
    //     }
    //   }
    // });
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении пользователя' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - частичное обновление пользователя
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
    
    // Проверка роли пользователя (только ADMIN и сам пользователь)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'Недостаточно прав для обновления данных пользователя' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    const data = await request.json();
    
    // Получаем текущего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        player: true,
        coach: true
      }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    // Проверяем, не меняется ли email на уже существующий
    if (data.email && data.email !== existingUser.email) {
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
    
    // Подготовка данных для обновления
    const updateData: any = {};
    
    // Обновляем основные данные
    if (data.email) updateData.email = data.email;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.roleId && userRole === 'ADMIN') updateData.roleId = data.roleId;
    
    // Если есть новый пароль, хешируем его
    if (data.password) {
      updateData.password = await hash(data.password, 10);
    }
    
    // Обновляем профиль, если есть изменения
    if (
      data.firstName || 
      data.lastName || 
      data.phone !== undefined || 
      data.address !== undefined ||
      data.avatar !== undefined
    ) {
      updateData.profile = {
        update: {
          firstName: data.firstName || existingUser.profile?.firstName,
          lastName: data.lastName || existingUser.profile?.lastName,
          phone: data.phone !== undefined ? data.phone : existingUser.profile?.phone,
          address: data.address !== undefined ? data.address : existingUser.profile?.address,
          avatar: data.avatar !== undefined ? data.avatar : existingUser.profile?.avatar
        }
      };
    }
    
    // Если пользователь - игрок и есть данные игрока
    if (existingUser.player && data.playerData) {
      updateData.player = {
        update: {
          birthDate: data.playerData.birthDate ? new Date(data.playerData.birthDate) : existingUser.player.birthDate,
          height: data.playerData.height !== undefined ? data.playerData.height : existingUser.player.height,
          weight: data.playerData.weight !== undefined ? data.playerData.weight : existingUser.player.weight,
          position: data.playerData.position || existingUser.player.position,
          jerseyNumber: data.playerData.jerseyNumber !== undefined ? data.playerData.jerseyNumber : existingUser.player.jerseyNumber
        }
      };
    }
    
    // Если пользователь - тренер и есть данные тренера
    if (existingUser.coach && data.coachData) {
      updateData.coach = {
        update: {
          specialization: data.coachData.specialization !== undefined ? data.coachData.specialization : existingUser.coach.specialization,
          experience: data.coachData.experience !== undefined ? data.coachData.experience : existingUser.coach.experience
        }
      };
    }
    
    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
        profile: true,
        player: true,
        coach: true
      }
    });
    
    // Скрываем пароль из ответа
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении пользователя' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - удаление пользователя
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
        { error: 'Недостаточно прав для удаления пользователя' },
        { status: 403 }
      );
    }
    
    // Запрещаем удалять самого себя
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить свою учетную запись' },
        { status: 400 }
      );
    }
    
    const userId = params.id;
    
    // Получаем пользователя, чтобы проверить его существование
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    // Создаем запись активности перед удалением
    // await prisma.activity.create({
    //   data: {
    //     userId: session.user.id,
    //     action: 'DELETE',
    //     entityType: 'USER',
    //     entityId: userId,
    //     details: {
    //       email: user.email,
    //       role: user.role.name
    //     }
    //   }
    // });
    
    // Удаляем пользователя (Prisma каскадно удалит все связанные данные)
    await prisma.user.delete({
      where: { id: userId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении пользователя' },
      { status: 500 }
    );
  }
} 