import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Функция для генерации случайного числа в заданном диапазоне
 * @param min Минимальное значение
 * @param max Максимальное значение
 * @returns Случайное число
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Функция для генерации статистики игрока
 * @returns Объект со статистикой
 */
function generatePlayerStats() {
  // Генерация реалистичных моковых данных для баскетбольной статистики
  const fieldGoalsAttempted = randomInt(5, 20);
  const fieldGoalsMade = randomInt(0, fieldGoalsAttempted);
  
  const threePointersAttempted = randomInt(1, 10);
  const threePointersMade = randomInt(0, Math.min(threePointersAttempted, fieldGoalsMade));
  
  const freeThrowsAttempted = randomInt(0, 10);
  const freeThrowsMade = randomInt(0, freeThrowsAttempted);
  
  // Рассчет очков на основе попаданий
  const points = (fieldGoalsMade - threePointersMade) * 2 + threePointersMade * 3 + freeThrowsMade;
  
  return {
    points,
    rebounds: randomInt(0, 12),
    assists: randomInt(0, 8),
    steals: randomInt(0, 5),
    blocks: randomInt(0, 3),
    turnovers: randomInt(0, 6),
    minutesPlayed: randomInt(5, 40),
    fieldGoalsMade,
    fieldGoalsAttempted,
    threePointersMade,
    threePointersAttempted,
    freeThrowsMade,
    freeThrowsAttempted,
  };
}

/**
 * Основная функция скрипта
 */
async function main() {
  try {
    console.log('Заполнение статистики игроков...');
    
    // Получение всех игроков с профилями пользователей
    const players = await prisma.player.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });
    
    console.log(`Найдено игроков: ${players.length}`);
    
    // Для каждого игрока
    for (const player of players) {
      console.log(`Обработка игрока: ${player.user.profile?.firstName} ${player.user.profile?.lastName}`);
      
      // Находим все события (матчи), в которых участвует игрок
      const eventPlayers = await prisma.eventPlayer.findMany({
        where: {
          playerId: player.id
        },
        include: {
          event: true
        }
      });
      
      if (eventPlayers.length === 0) {
        console.log(`  У игрока нет матчей, пропускаем`);
        continue;
      }
      
      console.log(`  Найдено событий с участием игрока: ${eventPlayers.length}`);
      
      // Получаем только события типа MATCH
      const matchEvents = eventPlayers.filter(ep => ep.event.eventType === 'MATCH');
      
      if (matchEvents.length === 0) {
        console.log(`  У игрока нет матчей, пропускаем`);
        continue;
      }
      
      console.log(`  Матчей с участием игрока: ${matchEvents.length}`);
      
      // Получаем идентификаторы событий
      const eventIds = matchEvents.map(me => me.eventId);
      
      // Получаем все матчи, соответствующие этим событиям
      const playerMatches = await prisma.match.findMany({
        where: {
          eventId: {
            in: eventIds
          }
        },
        include: {
          homeTeam: true,
          awayTeam: true
        }
      });
      
      console.log(`  Найдено матчей для заполнения статистики: ${playerMatches.length}`);
      
      if (playerMatches.length === 0) {
        continue;
      }
      
      // Создаем или обновляем статистику для каждого матча
      for (const match of playerMatches) {
        // Проверка, существует ли уже статистика для этого игрока и матча
        const existingStat = await prisma.playerStat.findUnique({
          where: {
            matchId_playerId: {
              matchId: match.id,
              playerId: player.id
            }
          }
        });
        
        const stats = generatePlayerStats();
        
        if (existingStat) {
          console.log(`  Обновление статистики в матче ${match.homeTeam.name} vs ${match.awayTeam.name}`);
          
          await prisma.playerStat.update({
            where: {
              id: existingStat.id
            },
            data: {
              points: existingStat.points + stats.points,
              rebounds: existingStat.rebounds + stats.rebounds,
              assists: existingStat.assists + stats.assists,
              steals: existingStat.steals + stats.steals,
              blocks: existingStat.blocks + stats.blocks,
              turnovers: existingStat.turnovers + stats.turnovers,
              minutesPlayed: (existingStat.minutesPlayed || 0) + stats.minutesPlayed,
              fieldGoalsMade: existingStat.fieldGoalsMade + stats.fieldGoalsMade,
              fieldGoalsAttempted: existingStat.fieldGoalsAttempted + stats.fieldGoalsAttempted,
              threePointersMade: existingStat.threePointersMade + stats.threePointersMade,
              threePointersAttempted: existingStat.threePointersAttempted + stats.threePointersAttempted,
              freeThrowsMade: existingStat.freeThrowsMade + stats.freeThrowsMade,
              freeThrowsAttempted: existingStat.freeThrowsAttempted + stats.freeThrowsAttempted,
            }
          });
        } else {
          console.log(`  Создание статистики в матче ${match.homeTeam.name} vs ${match.awayTeam.name}`);
          
          await prisma.playerStat.create({
            data: {
              matchId: match.id,
              playerId: player.id,
              ...stats
            }
          });
        }
      }
    }
    
    console.log('Статистика игроков успешно заполнена!');
  } catch (error) {
    console.error('Ошибка при заполнении статистики игроков:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 