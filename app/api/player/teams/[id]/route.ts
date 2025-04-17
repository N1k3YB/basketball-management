import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/player/teams/[id] - получение информации о команде
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'PLAYER') {
      return NextResponse.json(
        { error: 'Нет доступа' },
        { status: 403 }
      );
    }
    
    const teamId = params.id;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'ID команды не указан' },
        { status: 400 }
      );
    }
    
    // Получаем текущего игрока
    const currentPlayer = await prisma.player.findFirst({
      where: { userId: session.user.id }
    });
    
    if (!currentPlayer) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }
    
    // Проверяем, является ли игрок членом команды
    const teamPlayer = await prisma.teamPlayer.findFirst({
      where: {
        teamId,
        playerId: currentPlayer.id
      }
    });
    
    if (!teamPlayer) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этой команде' },
        { status: 403 }
      );
    }
    
    // Получаем команду с игроками и тренером
    const team = await prisma.team.findUnique({
      where: { id: teamId },
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
    
    if (!team) {
      return NextResponse.json(
        { error: 'Команда не найдена' },
        { status: 404 }
      );
    }
    
    // Форматируем данные
    const formattedTeam = {
      id: team.id,
      name: team.name,
      description: team.description,
      playersCount: team.teamPlayers.length,
      createdAt: team.createdAt.toISOString(),
      coach: team.coach ? {
        id: team.coach.id,
        userId: team.coach.userId,
        firstName: team.coach.user.profile?.firstName || '',
        lastName: team.coach.user.profile?.lastName || '',
        email: team.coach.user.email,
        avatar: team.coach.user.profile?.avatar || null,
        avatarType: team.coach.user.profile?.avatarType || null
      } : null,
      players: team.teamPlayers.map(tp => {
        return {
          id: tp.player.id,
          userId: tp.player.userId,
          firstName: tp.player.user.profile?.firstName || '',
          lastName: tp.player.user.profile?.lastName || '',
          email: tp.player.user.email,
          avatar: tp.player.user.profile?.avatar || null,
          avatarType: tp.player.user.profile?.avatarType || null,
          position: tp.player.position || 'Не указана',
          number: tp.player.jerseyNumber || 0,
          isCurrentPlayer: tp.player.id === currentPlayer.id
        };
      }),
      stats: {
        gamesPlayed: team.gamesPlayed,
        wins: team.wins, 
        losses: team.losses,
        draws: team.draws,
        pointsFor: team.pointsFor,
        pointsAgainst: team.pointsAgainst,
        winRate: team.gamesPlayed > 0 ? ((team.wins / team.gamesPlayed) * 100).toFixed(1) : '0.0'
      }
    };
    
    return NextResponse.json(formattedTeam);
    
  } catch (error) {
    console.error('Ошибка при получении данных команды:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 