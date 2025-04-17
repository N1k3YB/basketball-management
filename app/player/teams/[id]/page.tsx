'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/Table';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { 
  ChevronLeftIcon, 
  UserIcon, 
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import BasketballSpinner from '@/components/ui/BasketballSpinner';
import { Badge } from '@/components/ui/Badge';
import { formatPlayerPosition } from '@/lib/utils';
import { binaryToImageUrl } from '@/lib/utils/avatar';

interface Coach {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: any;
  avatarType: string | null;
}

interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: any;
  avatarType: string | null;
  position: string;
  number: number;
  isCurrentPlayer: boolean;
}

interface TeamStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  winRate: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  playersCount: number;
  createdAt: string;
  coach: Coach | null;
  players: Player[];
  stats: TeamStats;
}

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/player/teams/${teamId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не удалось загрузить данные команды');
        }
        
        const data = await response.json();
        setTeam(data);
        processAvatars(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Не удалось загрузить данные команды');
        }
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeamDetails();
    }
  }, [teamId]);

  // Функция для обработки аватаров
  const processAvatars = (teamData: Team) => {
    const urls: Record<string, string> = {};
    
    // Обработка аватара тренера
    if (teamData.coach?.avatar && teamData.coach?.avatarType) {
      const coachAvatarUrl = binaryToImageUrl(
        teamData.coach.avatar, 
        teamData.coach.avatarType
      );
      if (coachAvatarUrl) {
        urls[`coach-${teamData.coach.userId}`] = coachAvatarUrl;
      }
    }
    
    // Обработка аватаров игроков
    if (teamData.players && teamData.players.length > 0) {
      teamData.players.forEach((player) => {
        if (player.avatar && player.avatarType) {
          const playerAvatarUrl = binaryToImageUrl(
            player.avatar,
            player.avatarType
          );
          if (playerAvatarUrl) {
            urls[`player-${player.userId}`] = playerAvatarUrl;
          }
        }
      });
    }
    
    setAvatarUrls(urls);
  };

  // Получение URL аватара по ID пользователя
  const getAvatarUrl = (userType: 'coach' | 'player', userId: string) => {
    return avatarUrls[`${userType}-${userId}`] || null;
  };

  // Функция для перехода на профиль пользователя
  const navigateToProfile = (userId: string) => {
    if (!userId) return;
    router.push(`/profile/${userId}`);
  };

  return (
    <RoleProtectedLayout allowedRoles={['PLAYER']}>
      <div className="container px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center gap-1"
          onClick={() => router.push('/player/teams')}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Вернуться к списку команд
        </Button>
        
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка данных команды..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <Button onClick={() => router.push('/player/teams')} variant="outline" className="mt-2">
              Вернуться к списку команд
            </Button>
          </div>
        ) : team ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{team.name}</h1>
              {team.description && (
                <p className="text-gray-600">{team.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Основная информация</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Название команды</h3>
                        <p className="text-gray-800">{team.name}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Описание</h3>
                        <p className="text-gray-800">{team.description || 'Описание отсутствует'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Дата создания</h3>
                        <p className="text-gray-800">{new Date(team.createdAt).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Игроки команды</CardTitle>
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      <span className="font-semibold">{team.playersCount}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {team.players && team.players.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {team.players.map((player) => (
                          <div 
                            key={player.id} 
                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => navigateToProfile(player.userId)}
                          >
                            <div className="flex items-center space-x-4">
                              <Avatar
                                src={getAvatarUrl('player', player.userId)}
                                alt={`${player.firstName} ${player.lastName}`}
                                name={`${player.firstName} ${player.lastName}`}
                                size="md"
                                className="h-10 w-10"
                              />
                              <div>
                                <p className="font-medium">{player.firstName} {player.lastName}</p>
                                <p className="text-sm text-gray-500">{formatPlayerPosition(player.position)}</p>
                              </div>
                            </div>
                            {player.isCurrentPlayer && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-full ml-2 bg-blue-100 text-blue-800">
                                Вы
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">В этой команде нет игроков</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Тренер команды</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {team.coach ? (
                      <div 
                        className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigateToProfile(team.coach!.userId)}
                      >
                        <Avatar 
                          src={getAvatarUrl('coach', team.coach.userId)}
                          alt={`${team.coach.firstName} ${team.coach.lastName}`}
                          name={`${team.coach.firstName} ${team.coach.lastName}`}
                          size="lg"
                          className="h-16 w-16 mb-3"
                        />
                        <p className="font-medium text-lg">{team.coach.firstName} {team.coach.lastName}</p>
                        <p className="text-sm text-gray-500">{team.coach.email}</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-3">Тренер не назначен</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="shadow-md mt-6">
                  <CardHeader>
                    <CardTitle>Статистика</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Количество игроков:</span>
                        <span className="font-medium">{team.playersCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Всего матчей:</span>
                        <span className="font-medium">{team.stats.gamesPlayed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Победы:</span>
                        <span className="font-medium">{team.stats.wins}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Поражения:</span>
                        <span className="font-medium">{team.stats.losses}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Ничьи:</span>
                        <span className="font-medium">{team.stats.draws}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Процент побед:</span>
                        <span className="font-medium">{team.stats.winRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Набрано очков:</span>
                        <span className="font-medium">{team.stats.pointsFor}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Пропущено очков:</span>
                        <span className="font-medium">{team.stats.pointsAgainst}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </RoleProtectedLayout>
  );
} 