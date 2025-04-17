import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateMatchStats, updateTeamStats, updatePlayerStats } from '../../stats/sync/route';

// GET /api/events/[id] - получение конкретного события
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

    const eventId = params.id;
    
    // Получение события с включением связанных данных
    const event = await prisma.event.findUnique({
      where: {
        id: eventId
      },
      include: {
        eventTeams: {
          include: {
            team: true,
          },
        },
        eventPlayers: {
          include: {
            player: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
                teamPlayers: {
                  where: {
                    isActive: true
                  },
                  include: {
                    team: true
                  }
                }
              },
            },
          },
        },
        eventCoaches: {
          include: {
            coach: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            playerStats: true
          }
        },
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Событие не найдено' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Ошибка при получении события:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении события' },
      { status: 500 }
    );
  }
}

// Функция для парсинга даты в формате DD.MM.YYYY HH:mm
function parseCustomDate(dateStr: string): Date | null {
  try {
    console.log('Парсинг даты:', dateStr);
    
    // Проверка пустой строки
    if (!dateStr || typeof dateStr !== 'string') {
      console.log('Пустая строка или не строка');
      return null;
    }
    
    // Проверка формата ISO
    if (dateStr.includes('T') || dateStr.includes('-')) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        console.log('Дата в формате ISO успешно распарсена:', date.toISOString());
        return date;
      }
    }
    
    // Разделение даты и времени
    const parts = dateStr.split(' ');
    if (parts.length < 1) {
      console.log('Неверный формат: нет частей после разделения');
      return null;
    }
    
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : '00:00';
    
    console.log('Часть с датой:', datePart);
    console.log('Часть со временем:', timePart);
    
    // Разбор даты
    const dateComponents = datePart.split('.');
    if (dateComponents.length !== 3) {
      console.log('Неверный формат даты: ожидается DD.MM.YYYY');
      return null;
    }
    
    const day = parseInt(dateComponents[0], 10);
    const month = parseInt(dateComponents[1], 10) - 1; // Месяцы в JS начинаются с 0
    const year = parseInt(dateComponents[2], 10);
    
    console.log('День:', day, 'Месяц:', month + 1, 'Год:', year);
    
    // Разбор времени
    const timeComponents = timePart.split(':');
    const hours = parseInt(timeComponents[0] || '0', 10);
    const minutes = parseInt(timeComponents[1] || '0', 10);
    
    console.log('Часы:', hours, 'Минуты:', minutes);
    
    // Создание объекта даты
    const date = new Date(year, month, day, hours, minutes);
    
    // Проверка валидности
    if (isNaN(date.getTime())) {
      console.log('Невалидная дата после создания объекта Date');
      return null;
    }
    
    // Проверка компонентов даты
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      console.log('Компоненты даты изменились после создания объекта Date');
      return null;
    }
    
    console.log('Успешное создание даты:', date.toISOString());
    return date;
  } catch (error) {
    console.error('Ошибка при парсинге даты:', error);
    return null;
  }
}

// PUT /api/events/[id] - обновление события
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
    
    // Проверка роли пользователя
    if (session.user?.role !== 'ADMIN' && session.user?.role !== 'COACH') {
      return NextResponse.json(
        { error: 'Недостаточно прав для обновления события' },
        { status: 403 }
      );
    }
    
    const eventId = params.id;
    const {
      title,
      description,
      eventType,
      startTime: startTimeInput,
      endTime: endTimeInput,
      location,
      status,
      teamIds,
      match,
      syncData = false // Параметр для автоматической синхронизации
    } = await request.json();
    
    // Получение текущего события
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        match: true,
        eventTeams: {
          include: {
            team: {
              include: {
                coach: true
              }
            }
          }
        }
      }
    });
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Событие не найдено' },
        { status: 404 }
      );
    }
    
    // Проверка доступа тренера к событию
    if (session.user.role === 'COACH' && session.user.coachId) {
      const hasAccess = await prisma.eventTeam.findFirst({
        where: {
          eventId,
          team: {
            coachId: session.user.coachId
          }
        }
      });
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'У вас нет доступа к этому событию' },
          { status: 403 }
        );
      }
    }
    
    // Обработка дат
    let parsedStartTime = existingEvent.startTime;
    let parsedEndTime = existingEvent.endTime;
    
    if (startTimeInput) {
      console.log('Обработка даты начала:', startTimeInput);
      
      // Стандартный парсинг
      parsedStartTime = new Date(startTimeInput);
      
      // Кастомный парсинг при неудаче
      if (isNaN(parsedStartTime.getTime())) {
        console.log('Стандартный парсинг не удался, пробуем кастомный');
        const customParsedDate = parseCustomDate(startTimeInput);
        if (customParsedDate) {
          parsedStartTime = customParsedDate;
        } else {
          console.log('Не удалось распарсить дату начала, используем существующую');
          parsedStartTime = existingEvent.startTime;
        }
      }
    }
    
    if (endTimeInput) {
      console.log('Обработка даты окончания:', endTimeInput);
      
      // Стандартный парсинг
      parsedEndTime = new Date(endTimeInput);
      
      // Кастомный парсинг при неудаче
      if (isNaN(parsedEndTime.getTime())) {
        console.log('Стандартный парсинг не удался, пробуем кастомный');
        const customParsedDate = parseCustomDate(endTimeInput);
        if (customParsedDate) {
          parsedEndTime = customParsedDate;
        } else {
          console.log('Не удалось распарсить дату окончания, используем существующую');
          parsedEndTime = existingEvent.endTime;
        }
      }
    }
    
    // Базовые данные для обновления события
    const updateData: any = {
      title,
      description,
      eventType,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      location,
      status: status || 'SCHEDULED'
    };
    
    // Создаем массив промисов для транзакции
    const transactionPromises = [];
    
    // Обновление базовой информации о событии
    transactionPromises.push(
      prisma.event.update({
        where: { id: eventId },
        data: updateData
      })
    );
    
    // Обновление связей с командами при их наличии
    if (teamIds) {
      // Удаление старых связей
      transactionPromises.push(
        prisma.event.update({
          where: { id: eventId },
          data: {
            eventTeams: {
              deleteMany: {}
            }
          }
        })
      );
      
      // Создание новых связей
      if (teamIds.length > 0) {
        transactionPromises.push(
          prisma.event.update({
            where: { id: eventId },
            data: {
              eventTeams: {
                create: teamIds.map((teamId: string) => ({
                  team: {
                    connect: { id: teamId }
                  }
                }))
              }
            }
          })
        );
      }
    }
    
    // Обновление информации о матче при его наличии
    if (eventType === 'MATCH' && match) {
      // Сохранение предыдущего статуса матча для проверки изменений
      const oldMatchStatus = existingEvent.match?.status;
      
      // Синхронизация статуса матча со статусом события
      const matchStatus = status ? status : (match.status || 'SCHEDULED');
      
      if (existingEvent.match) {
        // Обновление существующего матча
        const matchUpdateData: any = {
          homeTeam: {
            connect: { id: match.homeTeamId }
          },
          status: matchStatus,
          homeScore: match.homeScore,
          awayScore: match.awayScore
        };
        
        // Обработка данных гостевой команды
        if (match.awayTeamId) {
          // Использование указанного ID гостевой команды
          matchUpdateData.awayTeam = {
            connect: { id: match.awayTeamId }
          };
        } else {
          // Использование ID домашней команды для гостевой
          matchUpdateData.awayTeam = {
            connect: { id: match.homeTeamId }
          };
        }
        
        transactionPromises.push(
          prisma.match.update({
            where: { id: existingEvent.match.id },
            data: matchUpdateData
          })
        );
      } else {
        // Создание нового матча
        const matchCreateData: any = {
          event: {
            connect: { id: eventId }
          },
          homeTeam: {
            connect: { id: match.homeTeamId }
          },
          status: matchStatus,
          homeScore: match.homeScore,
          awayScore: match.awayScore
        };
        
        // Обработка данных гостевой команды
        if (match.awayTeamId) {
          // Использование указанного ID гостевой команды
          matchCreateData.awayTeam = {
            connect: { id: match.awayTeamId }
          };
        } else {
          // Использование ID домашней команды для гостевой
          matchCreateData.awayTeam = {
            connect: { id: match.homeTeamId }
          };
        }
        
        transactionPromises.push(
          prisma.match.create({
            data: matchCreateData
          })
        );
      }
      
      // Автоматическая синхронизация статистики при сохранении изменений
      if (status === 'COMPLETED' || syncData) {
        // Получение всех игроков из домашней команды
        const homeTeamPlayers = await prisma.teamPlayer.findMany({
          where: {
            teamId: match.homeTeamId,
            isActive: true
          },
          select: {
            playerId: true
          }
        });
        
        // Обновление статистики игроков домашней команды
        if (existingEvent.match && homeTeamPlayers.length > 0) {
          // Создание записей о матчах для всех игроков
          for (const player of homeTeamPlayers) {
            // Проверка наличия статистики игрока по данному матчу
            const existingStats = await prisma.playerStat.findUnique({
              where: {
                matchId_playerId: {
                  matchId: existingEvent.match.id,
                  playerId: player.playerId
                }
              }
            });
            
            // Создание записи с нулевыми значениями при отсутствии статистики
            if (!existingStats) {
              transactionPromises.push(
                prisma.playerStat.create({
                  data: {
                    matchId: existingEvent.match.id,
                    playerId: player.playerId,
                    points: 0,
                    rebounds: 0,
                    assists: 0,
                    steals: 0,
                    blocks: 0,
                    turnovers: 0,
                    minutesPlayed: 0,
                    fieldGoalsMade: 0,
                    fieldGoalsAttempted: 0,
                    threePointersMade: 0,
                    threePointersAttempted: 0,
                    freeThrowsMade: 0,
                    freeThrowsAttempted: 0
                  }
                })
              );
            }
          }
        }
      }
    } else if (existingEvent.match && eventType !== 'MATCH') {
      // Удаление матча при изменении типа события
      transactionPromises.push(
        prisma.event.update({
          where: { id: eventId },
          data: {
            match: {
              delete: true
            }
          }
        })
      );
    }
    
    const results = await prisma.$transaction(transactionPromises);
    
    // Проверка необходимости обновления статистики после обновления события
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        match: true
      }
    });

    // Обновление статистики команд при завершении матча
    if (updatedEvent?.match) {
      if (status === 'COMPLETED') {
        console.log('Обновление статистики для завершенного матча');
        
        // Обновление статистики команд-участниц
        await updateTeamStats(updatedEvent.match.homeTeamId);
        
        // Обновление статистики гостевой команды при её отличии от домашней
        if (updatedEvent.match.awayTeamId !== updatedEvent.match.homeTeamId) {
          await updateTeamStats(updatedEvent.match.awayTeamId);
        }
        
        // Обновление статистики игроков матча
        const playerStats = await prisma.playerStat.findMany({
          where: {
            matchId: updatedEvent.match.id
          }
        });
        
        for (const stat of playerStats) {
          await updatePlayerStats(stat.playerId);
        }
      }
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Ошибка при обновлении события:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении события' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - удаление события
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
    
    // Проверка роли пользователя
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления события' },
        { status: 403 }
      );
    }
    
    const eventId = params.id;
    
    // Получение события с связанными данными матча
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        match: {
          include: {
            playerStats: true
          }
        },
        eventTeams: {
          include: {
            team: true
          }
        },
        eventPlayers: true
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Событие не найдено' },
        { status: 404 }
      );
    }
    
    // Сохранение списка команд для обновления статистики
    let teamsToUpdate = new Set<string>();
    
    // Сохранение списка игроков для обновления статистики
    let playersToUpdate = new Set<string>();
    
    // Добавление команд из матча
    if (event.match) {
      teamsToUpdate.add(event.match.homeTeamId);
      
      // Добавление гостевой команды при её отличии от домашней
      if (event.match.awayTeamId !== event.match.homeTeamId) {
        teamsToUpdate.add(event.match.awayTeamId);
      }
      
      // Добавление игроков из статистики матча
      event.match.playerStats.forEach(stat => {
        playersToUpdate.add(stat.playerId);
      });
    }
    
    // Добавление игроков, связанных с событием
    event.eventPlayers.forEach(ep => {
      playersToUpdate.add(ep.playerId);
    });
    
    // Добавление всех команд, связанных с событием
    event.eventTeams.forEach(et => {
      teamsToUpdate.add(et.teamId);
    });
    
    // Удаление события (Prisma каскадно удалит все связанные данные)
    await prisma.event.delete({
      where: { id: eventId }
    });
    
    console.log('Обновление статистики команд после удаления события:', Array.from(teamsToUpdate));
    
    // Обновление статистики всех затронутых команд
    for (const teamId of Array.from(teamsToUpdate)) {
      await updateTeamStats(teamId);
    }
    
    // Обновление статистики всех затронутых игроков
    for (const playerId of Array.from(playersToUpdate)) {
      await updatePlayerStats(playerId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении события:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении события' },
      { status: 500 }
    );
  }
} 