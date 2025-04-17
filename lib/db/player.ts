import prisma from '@/lib/prisma';
import { PlayerPosition } from '@prisma/client';

/**
 * Получить всех игроков
 */
export async function getAllPlayers() {
  return prisma.player.findMany({
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      teamPlayers: {
        where: {
          isActive: true,
        },
        include: {
          team: true,
        },
      },
    },
  });
}

/**
 * Получить игрока по ID
 */
export async function getPlayerById(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      teamPlayers: {
        where: {
          isActive: true,
        },
        include: {
          team: true,
        },
      },
      playerStats: {
        include: {
          match: {
            include: {
              event: true,
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Получить игрока по ID пользователя
 */
export async function getPlayerByUserId(userId: string) {
  return prisma.player.findUnique({
    where: { userId },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      teamPlayers: {
        where: {
          isActive: true,
        },
        include: {
          team: true,
        },
      },
    },
  });
}

/**
 * Создать игрока
 */
export async function createPlayer(
  userId: string,
  data: {
    birthDate: Date;
    height?: number;
    weight?: number;
    position: PlayerPosition;
    jerseyNumber?: number;
  }
) {
  return prisma.player.create({
    data: {
      userId,
      ...data,
    },
  });
}

/**
 * Обновить данные игрока
 */
export async function updatePlayer(
  id: string,
  data: {
    birthDate?: Date;
    height?: number;
    weight?: number;
    position?: PlayerPosition;
    jerseyNumber?: number;
  }
) {
  return prisma.player.update({
    where: { id },
    data,
  });
}

/**
 * Удалить игрока
 */
export async function deletePlayer(id: string) {
  return prisma.player.delete({
    where: { id },
  });
}

/**
 * Получить всех игроков команды
 */
export async function getTeamPlayers(teamId: string) {
  return prisma.teamPlayer.findMany({
    where: {
      teamId,
      isActive: true,
    },
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
  });
}

/**
 * Добавить игрока в команду
 */
export async function addPlayerToTeam(teamId: string, playerId: string) {
  // Проверка наличия игрока в команде
  const existingRecord = await prisma.teamPlayer.findUnique({
    where: {
      teamId_playerId: {
        teamId,
        playerId,
      },
    },
  });

  if (existingRecord) {
    if (existingRecord.isActive) {
      throw new Error('Player is already in this team');
    }
    
    // Активация записи для неактивного игрока
    return prisma.teamPlayer.update({
      where: {
        id: existingRecord.id,
      },
      data: {
        isActive: true,
        leaveDate: null,
      },
    });
  }

  // Создание новой записи
  return prisma.teamPlayer.create({
    data: {
      teamId,
      playerId,
    },
  });
}

/**
 * Удалить игрока из команды
 */
export async function removePlayerFromTeam(teamId: string, playerId: string) {
  const teamPlayer = await prisma.teamPlayer.findUnique({
    where: {
      teamId_playerId: {
        teamId,
        playerId,
      },
    },
  });

  if (!teamPlayer) {
    throw new Error('Player is not in this team');
  }

  return prisma.teamPlayer.update({
    where: {
      id: teamPlayer.id,
    },
    data: {
      isActive: false,
      leaveDate: new Date(),
    },
  });
}

/**
 * Получить статистику игрока
 */
export async function getPlayerStats(playerId: string) {
  return prisma.playerStat.findMany({
    where: {
      playerId,
    },
    include: {
      match: {
        include: {
          event: true,
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: {
      match: {
        event: {
          startTime: 'desc',
        },
      },
    },
  });
}

/**
 * Получить расписание игрока (все события, в которых участвует игрок)
 */
export async function getPlayerSchedule(playerId: string) {
  return prisma.eventPlayer.findMany({
    where: {
      playerId,
    },
    include: {
      event: {
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
      },
    },
    orderBy: {
      event: {
        startTime: 'asc',
      },
    },
  });
}

/**
 * Получить ближайшие события игрока
 */
export async function getPlayerUpcomingEvents(playerId: string, limit = 5) {
  const now = new Date();
  
  return prisma.eventPlayer.findMany({
    where: {
      playerId,
      event: {
        startTime: {
          gte: now,
        },
      },
    },
    include: {
      event: {
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
      },
    },
    orderBy: {
      event: {
        startTime: 'asc',
      },
    },
    take: limit,
  });
} 