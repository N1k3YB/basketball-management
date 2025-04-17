import prisma from '@/lib/prisma';

/**
 * Получить всех тренеров
 */
export async function getAllCoaches() {
  return prisma.coach.findMany({
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      teams: true,
    },
  });
}

/**
 * Получить тренера по ID
 */
export async function getCoachById(id: string) {
  return prisma.coach.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      teams: {
        include: {
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
      },
    },
  });
}

/**
 * Получить тренера по ID пользователя
 */
export async function getCoachByUserId(userId: string) {
  return prisma.coach.findUnique({
    where: { userId },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      teams: true,
    },
  });
}

/**
 * Создать тренера
 */
export async function createCoach(
  userId: string,
  data: {
    specialization?: string;
    experience?: number;
  }
) {
  return prisma.coach.create({
    data: {
      userId,
      ...data,
    },
  });
}

/**
 * Обновить данные тренера
 */
export async function updateCoach(
  id: string,
  data: {
    specialization?: string;
    experience?: number;
  }
) {
  return prisma.coach.update({
    where: { id },
    data,
  });
}

/**
 * Удалить тренера
 */
export async function deleteCoach(id: string) {
  return prisma.coach.delete({
    where: { id },
  });
}

/**
 * Назначить тренера команде
 */
export async function assignCoachToTeam(coachId: string, teamId: string) {
  return prisma.team.update({
    where: { id: teamId },
    data: {
      coachId,
    },
  });
}

/**
 * Получить команды тренера
 */
export async function getCoachTeams(coachId: string) {
  return prisma.team.findMany({
    where: {
      coachId,
    },
    include: {
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
 * Получить расписание тренера (все события, в которых участвует тренер)
 */
export async function getCoachSchedule(coachId: string) {
  // События, где тренер прямо указан как участник
  const coachEvents = await prisma.eventCoach.findMany({
    where: {
      coachId,
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
  });

  // Также получаем события для команд тренера
  const teamIds = await prisma.team
    .findMany({
      where: {
        coachId,
      },
      select: {
        id: true,
      },
    })
    .then((teams: { id: string }[]) => teams.map((team: { id: string }) => team.id));

  const teamEvents = await prisma.eventTeam.findMany({
    where: {
      teamId: {
        in: teamIds,
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
  });

  // Объединяем события и сортируем по дате начала
  const events = [
    ...coachEvents.map((ce: any) => ({
      ...ce.event,
      participantType: 'coach' as const,
    })),
    ...teamEvents.map((te: any) => ({
      ...te.event,
      participantType: 'team' as const,
      teamId: te.teamId,
    })),
  ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return events;
}

/**
 * Получить ближайшие события тренера
 */
export async function getCoachUpcomingEvents(coachId: string, limit = 5) {
  const now = new Date();
  const allEvents = await getCoachSchedule(coachId);
  
  return allEvents
    .filter(event => event.startTime > now)
    .slice(0, limit);
} 