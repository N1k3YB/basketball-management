import prisma from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

// Определим типы для EventType и MatchStatus
type EventType = 'TRAINING' | 'MATCH' | 'MEETING' | 'OTHER';
type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';

/**
 * Получить все события
 */
export async function getAllEvents() {
  return prisma.event.findMany({
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
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });
}

/**
 * Получить событие по ID
 */
export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
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
        },
      },
    },
  });
}

/**
 * Создать событие (тренировка, собрание)
 */
export async function createEvent(
  data: {
    title: string;
    description?: string;
    eventType: EventType;
    startTime: Date;
    endTime: Date;
    location?: string;
    teamIds?: string[];
    playerIds?: string[];
    coachIds?: string[];
  }
) {
  const { teamIds, playerIds, coachIds, ...eventData } = data;

  return prisma.$transaction(async (tx: PrismaClient) => {
    // Создание события
    const event = await tx.event.create({
      data: eventData,
    });

    // Добавление команд к событию
    if (teamIds && teamIds.length > 0) {
      await Promise.all(
        teamIds.map((teamId) =>
          tx.eventTeam.create({
            data: {
              eventId: event.id,
              teamId,
            },
          })
        )
      );
    }

    // Добавление игроков к событию
    if (playerIds && playerIds.length > 0) {
      await Promise.all(
        playerIds.map((playerId) =>
          tx.eventPlayer.create({
            data: {
              eventId: event.id,
              playerId,
            },
          })
        )
      );
    }

    // Добавление тренеров к событию
    if (coachIds && coachIds.length > 0) {
      await Promise.all(
        coachIds.map((coachId) =>
          tx.eventCoach.create({
            data: {
              eventId: event.id,
              coachId,
            },
          })
        )
      );
    }

    return event;
  });
}

/**
 * Создать матч
 */
export async function createMatch(
  data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    homeTeamId: string;
    awayTeamName: string;
    status?: MatchStatus;
  }
) {
  const { homeTeamId, awayTeamName, status, ...eventData } = data;

  return prisma.$transaction(async (prisma) => {
    // Создание события
    const event = await prisma.event.create({
      data: {
        ...eventData,
        eventType: 'MATCH',
      },
    });

    // Создание матча
    const match = await prisma.match.create({
      data: {
        eventId: event.id,
        status: status || 'SCHEDULED',
        // Использование объекта для связи с домашней командой
        homeTeam: {
          connect: {
            id: homeTeamId
          }
        },
        // Для гостевой команды используется та же домашняя команда
        awayTeam: {
          connect: {
            id: homeTeamId
          }
        }
      },
    });

    // Добавление домашней команды к событию
    await prisma.eventTeam.create({
      data: {
        eventId: event.id,
        teamId: homeTeamId
      },
    });

    // Получение всех игроков из домашней команды
    const homePlayers = await prisma.teamPlayer.findMany({
      where: {
        teamId: homeTeamId,
        isActive: true,
      },
      select: {
        playerId: true,
      },
    });

    // Добавление игроков домашней команды к событию
    if (homePlayers.length > 0) {
      await prisma.eventPlayer.createMany({
        data: homePlayers.map((p) => ({
          eventId: event.id,
          playerId: p.playerId,
        })),
      });
    }

    // Получение тренера домашней команды
    const homeTeam = await prisma.team.findUnique({
      where: { id: homeTeamId },
      select: { coachId: true },
    });

    // Добавление тренера к событию
    if (homeTeam?.coachId) {
      await prisma.eventCoach.create({
        data: {
          eventId: event.id,
          coachId: homeTeam.coachId,
        },
      });
    }

    return {
      event,
      match,
    };
  });
}

/**
 * Обновить событие
 */
export async function updateEvent(
  id: string,
  data: {
    title?: string;
    description?: string;
    eventType?: EventType;
    startTime?: Date;
    endTime?: Date;
    location?: string;
  }
) {
  return prisma.event.update({
    where: { id },
    data,
  });
}

/**
 * Обновить статус матча и результат
 */
export async function updateMatchResult(
  matchId: string,
  data: {
    homeScore?: number;
    awayScore?: number;
    status?: MatchStatus;
  }
) {
  return prisma.match.update({
    where: { id: matchId },
    data,
  });
}

/**
 * Удалить событие
 */
export async function deleteEvent(id: string) {
  return prisma.event.delete({
    where: { id },
  });
}

/**
 * Добавить игрока к событию
 */
export async function addPlayerToEvent(eventId: string, playerId: string) {
  return prisma.eventPlayer.create({
    data: {
      eventId,
      playerId,
    },
  });
}

/**
 * Обновить статус посещения игрока
 */
export async function updatePlayerAttendance(
  eventId: string,
  playerId: string,
  attendance: 'PLANNED' | 'ATTENDED' | 'ABSENT' | 'EXCUSED'
) {
  return prisma.eventPlayer.update({
    where: {
      eventId_playerId: {
        eventId,
        playerId,
      },
    },
    data: {
      attendance,
    },
  });
}

/**
 * Получить все события в диапазоне дат
 */
export async function getEventsByDateRange(start: Date, end: Date) {
  return prisma.event.findMany({
    where: {
      startTime: {
        gte: start,
      },
      endTime: {
        lte: end,
      },
    },
    include: {
      eventTeams: {
        include: {
          team: true,
        },
      },
      match: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });
}

/**
 * Получить ближайшие события
 */
export async function getUpcomingEvents(limit = 5) {
  const now = new Date();
  
  return prisma.event.findMany({
    where: {
      startTime: {
        gte: now,
      },
    },
    include: {
      eventTeams: {
        include: {
          team: true,
        },
      },
      match: {
        include: {
          homeTeam: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
    take: limit,
  });
}

/**
 * Добавить статистику игрока в матче
 */
export async function addPlayerStats(
  matchId: string,
  playerId: string,
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    minutesPlayed: number;
  }
) {
  return prisma.playerStat.upsert({
    where: {
      matchId_playerId: {
        matchId,
        playerId,
      },
    },
    update: stats,
    create: {
      matchId,
      playerId,
      ...stats,
    },
  });
} 