import { execSync } from 'child_process';
import path from 'path';

/**
 * Скрипт для инициализации базы данных
 * Запускает миграции Prisma и заполняет базу начальными данными
 */
async function main() {
  try {
    console.log('Начало инициализации базы данных...');
    
    console.log('Применение миграций...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Заполнение базы начальными данными...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('База данных успешно инициализирована!');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
}

main(); 