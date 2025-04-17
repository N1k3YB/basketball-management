import prisma from '@/lib/prisma';

/**
 * Получить настройку по ключу
 */
export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  return setting ? setting.value : null;
}

/**
 * Установить или обновить настройку
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/**
 * Получить все настройки
 */
export async function getAllSettings() {
  return prisma.setting.findMany();
}

/**
 * Удалить настройку
 */
export async function deleteSetting(key: string): Promise<void> {
  await prisma.setting.delete({
    where: { key },
  });
}

/**
 * Инициализация базовых настроек системы
 */
export async function initializeSettings(): Promise<void> {
  const defaultSettings = [
    { key: 'SITE_NAME', value: 'Система управления баскетбольным клубом' },
    { key: 'SITE_DESCRIPTION', value: 'Платформа для управления баскетбольным клубом: игроки, тренеры, команды, матчи и статистика' },
    { key: 'CONTACT_EMAIL', value: 'info@basketball-club.com' },
    { key: 'DEFAULT_LOCALE', value: 'ru' },
    { key: 'EVENTS_PER_PAGE', value: '10' },
    { key: 'PLAYERS_PER_PAGE', value: '20' },
    { key: 'ENABLE_EMAIL_NOTIFICATIONS', value: 'true' },
  ];

  for (const setting of defaultSettings) {
    await setSetting(setting.key, setting.value);
  }
} 