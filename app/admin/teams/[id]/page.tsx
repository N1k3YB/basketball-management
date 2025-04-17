'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { Pencil, Trash2, AlertCircle, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatPlayerPosition } from '@/lib/utils';
import { binaryToImageUrl } from '@/lib/utils/avatar';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface TeamDetailProps {
  params: {
    id: string;
  };
}

export default function TeamDetailPage({ params }: TeamDetailProps) {
  const router = useRouter();
  const { id } = params;
  
  const [team, setTeam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [upcomingEvents, setUpcomingEvents] = useState<number>(0);
  
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/teams/${id}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные команды');
        }
        
        const data = await response.json();
        setTeam(data);
        
        // Обработка аватаров
        processAvatars(data);
        
        // Получаем количество предстоящих событий
        fetchUpcomingEvents(id);
      } catch (error) {
        console.error('Ошибка при загрузке команды:', error);
        setError('Не удалось загрузить информацию о команде');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeam();
  }, [id]);
  
  // Функция для загрузки количества предстоящих событий
  const fetchUpcomingEvents = async (teamId: string) => {
    try {
      const now = new Date().toISOString();
      const response = await fetch(`/api/events?teamId=${teamId}&startAfter=${now}&status=SCHEDULED`);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить предстоящие события');
      }
      
      const data = await response.json();
      setUpcomingEvents(data.length || 0);
    } catch (error) {
      console.error('Ошибка при загрузке предстоящих событий:', error);
    }
  };
  
  // Функция для обработки всех аватаров команды
  const processAvatars = (teamData: any) => {
    const urls: Record<string, string> = {};
    
    // Обработка аватара тренера
    if (teamData.coach?.user?.profile?.avatar && teamData.coach?.user?.profile?.avatarType) {
      const coachAvatarUrl = binaryToImageUrl(
        teamData.coach.user.profile.avatar, 
        teamData.coach.user.profile.avatarType
      );
      if (coachAvatarUrl) {
        urls[`coach-${teamData.coach.user.id}`] = coachAvatarUrl;
      }
    }
    
    // Обработка аватаров игроков
    if (teamData.teamPlayers && teamData.teamPlayers.length > 0) {
      teamData.teamPlayers.forEach((teamPlayer: any) => {
        if (teamPlayer.player?.user?.profile?.avatar && 
            teamPlayer.player?.user?.profile?.avatarType) {
          const playerAvatarUrl = binaryToImageUrl(
            teamPlayer.player.user.profile.avatar,
            teamPlayer.player.user.profile.avatarType
          );
          if (playerAvatarUrl) {
            urls[`player-${teamPlayer.player.user.id}`] = playerAvatarUrl;
          }
        }
      });
    }
    
    setAvatarUrls(urls);
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить эту команду? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось удалить команду');
      }
      
      router.push('/admin/teams');
    } catch (error) {
      console.error('Ошибка при удалении команды:', error);
      setError(error instanceof Error ? error.message : 'Не удалось удалить команду');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  const formatUserName = (user: any) => {
    if (!user) return 'Не назначен';
    
    if (user.profile?.firstName || user.profile?.lastName) {
      return `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();
    }
    return user.email;
  };
  
  const navigateToProfile = (userId: string) => {
    if (!userId) return;
    router.push(`/profile/${userId}`);
  };
  
  // Получение URL аватара по ID пользователя
  const getAvatarUrl = (userType: 'coach' | 'player', userId: string) => {
    return avatarUrls[`${userType}-${userId}`] || null;
  };
  
  if (isLoading) {
    return (
      <RoleProtectedLayout allowedRoles={['ADMIN']}>
        <div className="container mx-auto py-10 flex justify-center items-center min-h-[calc(100vh-4rem)]">
          <BasketballSpinner label="Загрузка команды..." />
        </div>
      </RoleProtectedLayout>
    );
  }
  
  if (error || !team) {
    return (
      <RoleProtectedLayout allowedRoles={['ADMIN']}>
        <div className="container mx-auto py-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="mr-2" />
            <span>{error || 'Команда не найдена'}</span>
          </div>
          <div className="mt-4">
            <Button onClick={() => router.push('/admin/teams')}>
              Вернуться к списку команд
            </Button>
          </div>
        </div>
      </RoleProtectedLayout>
    );
  }
  
  // Расчет процента побед
  const winPercentage = team.gamesPlayed > 0 
    ? Math.round((team.wins / team.gamesPlayed) * 100) 
    : 0;
  
  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Информация о команде</h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/teams')}
            >
              Назад к списку
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/teams/${id}/edit`)}
              className="flex items-center"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Редактировать
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <AlertCircle className="mr-2" />
            <span>{error}</span>
          </div>
        )}
        
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
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Дата создания</h3>
                    <p className="text-gray-800">{formatDate(team.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Игроки команды</CardTitle>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  <span className="font-semibold">{team.teamPlayers?.length || 0}</span>
                </div>
              </CardHeader>
              <CardContent>
                {team.teamPlayers && team.teamPlayers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {team.teamPlayers.map((teamPlayer: any) => (
                      <div 
                        key={teamPlayer.id} 
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                        onClick={() => navigateToProfile(teamPlayer.player.user.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar
                            src={getAvatarUrl('player', teamPlayer.player.user.id)}
                            alt={formatUserName(teamPlayer.player.user)}
                            name={formatUserName(teamPlayer.player.user)}
                            size="md"
                            className="h-10 w-10"
                          />
                          <div>
                            <p className="font-medium">{formatUserName(teamPlayer.player.user)}</p>
                            <p className="text-sm text-gray-500">{formatPlayerPosition(teamPlayer.player.position)}</p>
                          </div>
                        </div>
                        <span 
                          className={`text-xs font-semibold px-2 py-1 rounded-full ml-2 ${teamPlayer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
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
                <CardTitle>Тренер команды</CardTitle>
              </CardHeader>
              <CardContent>
                {team.coach ? (
                  <div 
                    className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                    onClick={() => navigateToProfile(team.coach.user.id)}
                  >
                    <Avatar 
                      src={getAvatarUrl('coach', team.coach.user.id)}
                      alt={formatUserName(team.coach.user)}
                      name={formatUserName(team.coach.user)}
                      size="lg"
                      className="h-16 w-16 mb-3"
                    />
                    <p className="font-medium text-lg">{formatUserName(team.coach.user)}</p>
                    <p className="text-sm text-gray-500">{team.coach.user?.email}</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-3">Тренер не назначен</p>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/admin/teams/${id}/edit`)}
                    >
                      Назначить тренера
                    </Button>
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
                    <span className="font-medium">{team.teamPlayers?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Предстоящие события:</span>
                    <span className="font-medium">{upcomingEvents}</span>
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
      </div>
    </RoleProtectedLayout>
  );
} 