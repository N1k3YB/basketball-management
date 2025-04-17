import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format as formatDate } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Соединяет классы с помощью clsx и tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует дату в удобочитаемый формат
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  
  // Получение дня, месяца и года
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  // Получение часов и минут
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // Форматирование в строку "DD.MM.YYYY, HH:MM"
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

/**
 * Форматирует дату без времени
 */
export function formatDateOnly(date: Date | string, format = 'dd.MM.yyyy'): string {
  if (!date) return '';
  return formatDate(new Date(date), format, { locale: ru });
}

/**
 * Возвращает возраст по дате рождения
 */
export function getAge(birthDate: Date | string): number {
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDifference = today.getMonth() - birthDateObj.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Форматирует строку для поиска, удаляя спецсимволы и приводя к нижнему регистру
 */
export function formatForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '');
}

/**
 * Форматирует число до заданной точности
 */
export function formatNumber(num: number, digits = 1): string {
  return num.toFixed(digits);
}

/**
 * Получает инициалы из полного имени
 */
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * Преобразует название позиции игрока в читаемый формат на русском
 */
export function formatPlayerPosition(position: string): string {
  const positions: Record<string, string> = {
    POINT_GUARD: 'Разыгрывающий защитник',
    SHOOTING_GUARD: 'Атакующий защитник',
    SMALL_FORWARD: 'Легкий форвард',
    POWER_FORWARD: 'Тяжелый форвард',
    CENTER: 'Центровой',
  };
  
  return positions[position] || position;
}

/**
 * Преобразует статус матча в читаемый формат на русском
 */
export function formatMatchStatus(status: string): string {
  const statuses: Record<string, string> = {
    SCHEDULED: 'Запланирован',
    IN_PROGRESS: 'В процессе',
    COMPLETED: 'Завершен',
    CANCELLED: 'Отменен',
    POSTPONED: 'Отложен',
  };
  
  return statuses[status] || status;
}

/**
 * Преобразует статус события в читаемый формат на русском
 */
export function formatEventStatus(status: string): string {
  const statuses: Record<string, string> = {
    SCHEDULED: 'Запланировано',
    IN_PROGRESS: 'В процессе',
    COMPLETED: 'Завершено',
    CANCELLED: 'Отменено',
  };
  
  return statuses[status] || status;
}

/**
 * Преобразует тип события в читаемый формат на русском
 */
export function formatEventType(type: string): string {
  const types: Record<string, string> = {
    TRAINING: 'Тренировка',
    MATCH: 'Матч',
    MEETING: 'Собрание',
    OTHER: 'Другое',
  };
  
  return types[type] || type;
}

/**
 * Преобразует статус посещения в читаемый формат на русском
 */
export function formatAttendanceStatus(status: string): string {
  const statuses: Record<string, string> = {
    PLANNED: 'Запланировано',
    ATTENDED: 'Присутствовал',
    ABSENT: 'Отсутствовал',
    EXCUSED: 'Отсутствовал (уваж.)',
  };
  
  return statuses[status] || status;
}

/**
 * Преобразует строку запроса в объект параметров
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

/**
 * Извлекает название внешней команды из описания события
 * @param description Описание события
 * @returns Название внешней команды или null если не найдено
 */
export function extractExternalTeamName(description?: string | null): string | null {
  if (!description) return null;
  
  const match = description.match(/Гостевая команда: (.+)($|\n)/);
  return match ? match[1] : null;
} 