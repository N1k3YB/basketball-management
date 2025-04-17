"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { Users } from 'lucide-react';
import { UserGroupIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@/components/ui/Avatar';
import { formatPlayerPosition } from '@/lib/utils';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatUserName(user: any) {
  if (!user) return 'Не назначен';
  if (user.profile?.firstName || user.profile?.lastName) {
    return `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();
  }
  return user.email;
}

interface TeamPlayer {
  id: string;
  isActive: boolean;
  player: {
    id: string;
    user: {
      id: string;
      email: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
        avatarType?: string;
      };
    };
    position?: string;
    jerseyNumber?: number | null;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  teamPlayers?: TeamPlayer[];
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  pointsFor?: number;
  pointsAgainst?: number;
}

export default function TeamDetailCoachPage() {
  const router = useRouter();
  const params = useParams();
  const { id: teamId } = params as { id: string };
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/teams/${teamId}`);
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные команды');
        }
        const data = await response.json();
        setTeam(data);
      } catch (error) {
        setError('Не удалось загрузить информацию о команде');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

  const winPercentage = team && team.gamesPlayed && team.gamesPlayed > 0 && team.wins !== undefined
    ? Math.round((team.wins / team.gamesPlayed) * 100)
    : 0;

  const formatTeamStatus = (team: Team) => {
    if (team.status === 'inactive' || team.isActive === false) return 'Неактивна';
    return 'Активна';
  };

  const formatTeamType = (team: Team) => {
    if (!team.category) return 'Основная';
    return team.category;
  };

  return (
    <RoleProtectedLayout allowedRoles={['COACH']}>
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="w-10 h-10 flex items-center justify-center rounded-full p-0 mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </Button>
          <h1 className="text-2xl font-bold">Информация о команде</h1>
        </div>
        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка команды..." />
          </div>
        ) : error || !team ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <span>{error || 'Команда не найдена'}</span>
          </div>
        ) : (
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
                      <p className="text-lg">{team.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Описание</h3>
                      <p className="text-gray-800">{team.description || 'Описание отсутствует'}</p>
                    </div>
                    <div className="flex flex-wrap gap-6 mt-4">
                      <div>
                        <span className="text-gray-500">Тип: </span>
                        <span className="font-medium">{formatTeamType(team)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Статус: </span>
                        <span className={`font-medium ${formatTeamStatus(team) === 'Активна' ? 'text-green-600' : 'text-red-600'}`}>{formatTeamStatus(team)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Дата создания: </span>
                        <span className="font-medium">{formatDate(team.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Игроки команды</CardTitle>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => router.push(`/coach/teams/${team.id}/players`)}
                  >
                    <UserGroupIcon className="h-5 w-5" />
                    Управлять игроками
                  </Button>
                </CardHeader>
                <CardContent>
                  {team.teamPlayers && team.teamPlayers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {team.teamPlayers.map((teamPlayer) => (
                        <div 
                          key={teamPlayer.id} 
                          className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/profile/${teamPlayer.player.user.id}`)}
                        >
                          <Avatar
                            src={teamPlayer.player.user.profile.avatar}
                            alt={formatUserName(teamPlayer.player.user)}
                            name={formatUserName(teamPlayer.player.user)}
                            size="md"
                            className="h-10 w-10"
                          />
                          <div className="ml-4 flex-grow">
                            <p className="font-medium">{formatUserName(teamPlayer.player.user)}</p>
                            <p className="text-sm text-gray-500">{teamPlayer.player.position ? formatPlayerPosition(teamPlayer.player.position) : 'Не указана'}</p>
                          </div>
                          <span 
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${teamPlayer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          `}>
                            {teamPlayer.isActive ? 'Активен' : 'Неактивен'}
                          </span>
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
                  <CardTitle>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Количество игроков:</span>
                      <span className="font-medium">{team.teamPlayers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Всего матчей:</span>
                      <span className="font-medium">{team.gamesPlayed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Победы:</span>
                      <span className="font-medium">{team.wins || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Поражения:</span>
                      <span className="font-medium">{team.losses || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Ничьи:</span>
                      <span className="font-medium">{team.draws || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Процент побед:</span>
                      <span className="font-medium">{winPercentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Набрано очков:</span>
                      <span className="font-medium">{team.pointsFor || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Пропущено очков:</span>
                      <span className="font-medium">{team.pointsAgainst || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </RoleProtectedLayout>
  );
} 