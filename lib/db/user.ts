import prisma from '@/lib/prisma';
import { hash, compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AvatarData } from '@/lib/utils/avatar';

/**
 * Найти пользователя по email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
      profile: true,
      player: true,
      coach: true,
    },
  });
}

/**
 * Найти пользователя по id
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      profile: true,
      player: true,
      coach: true,
    },
  });
}

/**
 * Аутентификация пользователя
 */
export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);

  if (!user || !user.isActive) {
    return null;
  }

  const passwordMatch = await compare(password, user.password);

  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.profile,
  };
}

/**
 * Создать пользователя
 */
export async function createUser(
  email: string,
  password: string,
  roleName: string,
  profileData: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    avatars?: string[];
  }
) {
  const hashedPassword = await hash(password, 10);

  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Role "${roleName}" not found`);
  }

  return prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        roleId: role.id,
      },
    });

    await tx.profile.create({
      data: {
        userId: user.id,
        ...profileData,
      },
    });

    return user;
  });
}

/**
 * Обновить пользователя
 */
export async function updateUser(
  id: string,
  data: {
    email?: string;
    password?: string;
    roleId?: string;
    isActive?: boolean;
  }
) {
  const updateData: any = { ...data };

  if (data.password) {
    updateData.password = await hash(data.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Обновить профиль пользователя
 */
export async function updateProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    avatar?: Buffer | null;
    avatarType?: string;
  }
) {
  return prisma.profile.update({
    where: { userId },
    data,
  });
}

/**
 * Получить всех пользователей с определенной ролью
 */
export async function getUsersByRole(roleName: string) {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Role "${roleName}" not found`);
  }

  return prisma.user.findMany({
    where: { roleId: role.id },
    include: {
      profile: true,
      role: true,
    },
  });
}

/**
 * Удалить пользователя
 */
export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

/**
 * Получить все роли
 */
export async function getAllRoles() {
  return prisma.role.findMany();
}

/**
 * Создать роль
 */
export async function createRole(name: string, description?: string) {
  return prisma.role.create({
    data: {
      name,
      description,
    },
  });
}

/**
 * Инициализация базовых ролей (admin, coach, player)
 */
export async function initializeRoles() {
  const roles = [
    { name: 'ADMIN', description: 'Administrator with full access' },
    { name: 'COACH', description: 'Coach with team management access' },
    { name: 'PLAYER', description: 'Player with limited access' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
      },
    });
  }

  return prisma.role.findMany();
}

/**
 * Получить всех пользователей
 */
export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      role: true,
      profile: true,
    },
  });
} 