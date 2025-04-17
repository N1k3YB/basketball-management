import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/teams - получить список команд
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка аутентификации
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const userRole = session.user.role?.toUpperCase();
    const coachId = url.searchParams.get('coachId');
    const playerId = url.searchParams.get('playerId');
    const search = url.searchParams.get('search');
    
    let teams;
    
    // Базовое условие для выборки
    const baseWhere: any = {};
    
    // Поиск по имени
    if (search) {
      baseWhere.name = {
        contains: search,
        mode: 'insensitive',
      };
    }
    
    // Фильтрация по роли пользователя
    if (userRole === 'ADMIN') {
      // Администраторы могут видеть все команды
      if (coachId) {
        baseWhere.coachId = coachId;
      }
      
      if (playerId) {
        baseWhere.teamPlayers = {
          some: {
            playerId
          }
        };
      }
      
      teams = await prisma.team.findMany({
        where: baseWhere,
        include: {
          coach: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          },
          teamPlayers: {
            include: {
              player: {
                include: {
                  user: {
                    include: {
                      profile: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              eventTeams: true,
              homeMatches: true,
              awayMatches: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else if (userRole === 'COACH') {
      // Тренеры видят только свои команды
      const coach = await prisma.coach.findFirst({
        where: { userId: session.user.id }
      });
      
      if (!coach) {
        return NextResponse.json({ error: 'Тренер не найден' }, { status: 404 });
      }
      
      teams = await prisma.team.findMany({
        where: {
          ...baseWhere,
          coachId: coach.id
        },
        include: {
          coach: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          },
          teamPlayers: {
            include: {
              player: {
                include: {
                  user: {
                    include: {
                      profile: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              eventTeams: true,
              homeMatches: true,
              awayMatches: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else if (userRole === 'PLAYER') {
      // Игроки видят только команды, в которых они участвуют
      const player = await prisma.player.findFirst({
        where: { userId: session.user.id }
      });
      
      if (!player) {
        return NextResponse.json({ error: 'Игрок не найден' }, { status: 404 });
      }
      
      teams = await prisma.team.findMany({
        where: {
          ...baseWhere,
          teamPlayers: {
            some: {
              playerId: player.id
            }
          }
        },
        include: {
          coach: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          },
          teamPlayers: {
            include: {
              player: {
                include: {
                  user: {
                    include: {
                      profile: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              eventTeams: true,
              homeMatches: true,
              awayMatches: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }
    
    // Форматируем данные для ответа
    const formattedTeams = teams.map((team: any) => {
      return {
        ...team,
        players: team.teamPlayers?.map((tp: any) => tp.player) || []
      };
    });
    
    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error('Ошибка при получении списка команд:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка команд' },
      { status: 500 }
    );
  }
}

// POST /api/teams - создать новую команду
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка аутентификации
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    // Проверка роли пользователя
    const userRole = session.user.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав для создания команды' }, { status: 403 });
    }
    
    // Получение данных из запроса
    const { name, description, coachId, playerIds } = await req.json();
    
    // Валидация
    if (!name) {
      return NextResponse.json({ error: 'Название команды обязательно' }, { status: 400 });
    }
    
    // Проверка наличия команды с таким именем
    const existingTeam = await prisma.team.findFirst({
      where: { name }
    });
    
    if (existingTeam) {
      return NextResponse.json({ error: 'Команда с таким названием уже существует' }, { status: 400 });
    }
    
    // Создание команды
    const newTeam = await prisma.team.create({
      data: {
        name,
        description,
        coach: coachId ? { connect: { id: coachId } } : undefined,
        teamPlayers: playerIds && playerIds.length > 0 
          ? { 
              create: playerIds.map((playerId: string) => ({
                player: { connect: { id: playerId } },
                isActive: true
              }))
            }
          : undefined
      },
      include: {
        coach: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        teamPlayers: {
          include: {
            player: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // Форматируем данные для ответа
    const formattedTeam = {
      ...newTeam,
      players: newTeam.teamPlayers?.map((tp: any) => tp.player) || []
    };
    
    return NextResponse.json(formattedTeam, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании команды' },
      { status: 500 }
    );
  }
} 