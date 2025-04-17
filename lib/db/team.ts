import prisma from '@/lib/prisma';

/**
 * Получить все команды
 */
export async function getAllTeams() {
  return prisma.team.findMany({
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
      teamPlayers: {
        where: {
          isActive: true,
        },
        include: {
          player: true,
        },
      },
    },
  });
}

/**
 * Получить команду по ID
 */
export async function getTeamById(id: string) {
  return prisma.team.findUnique({
    where: { id },
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
      teamPlayers: {
        where: {
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
      },
    },
  });
}

/**
 * Создать команду
 */
export async function createTeam(
  data: {
    name: string;
    description?: string;
    coachId?: string;
  }
) {
  return prisma.team.create({
    data,
  });
}

/**
 * Обновить команду
 */
export async function updateTeam(
  id: string,
  data: {
    name?: string;
    description?: string;
    coachId?: string;
  }
) {
  return prisma.team.update({
    where: { id },
    data,
  });
}

/**
 * Удалить команду
 */
export async function deleteTeam(id: string) {
  return prisma.team.delete({
    where: { id },
  });
}

/**
 * Получить события команды
 */
export async function getTeamEvents(teamId: string) {
  return prisma.eventTeam.findMany({
    where: {
      teamId,
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
 * Получить ближайшие события команды
 */
export async function getTeamUpcomingEvents(teamId: string, limit = 5) {
  const now = new Date();
  
  return prisma.eventTeam.findMany({
    where: {
      teamId,
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

/**
 * Получить все матчи команды
 */
export async function getTeamMatches(teamId: string) {
  return prisma.match.findMany({
    where: {
      homeTeamId: teamId,
    },
    include: {
      event: true,
      homeTeam: true,
      playerStats: {
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
    },
    orderBy: {
      event: {
        startTime: 'desc',
      },
    },
  });
}

/**
 * Получить статистику команды
 */
export async function getTeamStats(teamId: string) {
  const matches = await getTeamMatches(teamId);
  
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalPoints = 0;
  let totalPointsAgainst = 0;
  
  matches.forEach((match: any) => {
    if (match.status !== 'COMPLETED') return;
    
    if (match.homeTeamId === teamId) {
      if (match.homeScore && match.awayScore) {
        totalPoints += match.homeScore;
        totalPointsAgainst += match.awayScore;
        
        if (match.homeScore > match.awayScore) wins++;
        else if (match.homeScore < match.awayScore) losses++;
        else draws++;
      }
    } else {
      if (match.homeScore && match.awayScore) {
        totalPoints += match.awayScore;
        totalPointsAgainst += match.homeScore;
        
        if (match.awayScore > match.homeScore) wins++;
        else if (match.awayScore < match.homeScore) losses++;
        else draws++;
      }
    }
  });
  
  const completedMatchesCount = wins + losses + draws;
  
  return {
    totalMatches: matches.length,
    completedMatches: completedMatchesCount,
    wins,
    losses,
    draws,
    winPercentage: completedMatchesCount > 0 ? (wins / completedMatchesCount) * 100 : 0,
    totalPoints,
    totalPointsAgainst,
    pointsPerGame: completedMatchesCount > 0 ? totalPoints / completedMatchesCount : 0,
    pointsAgainstPerGame: completedMatchesCount > 0 ? totalPointsAgainst / completedMatchesCount : 0,
  };
} 