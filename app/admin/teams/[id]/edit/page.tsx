'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { AlertCircle } from 'lucide-react';
import { formatPlayerPosition } from '@/lib/utils';

export default function EditTeamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Данные команды
  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    coachId: ''
  });
  
  // Список тренеров и игроков
  const [coaches, setCoaches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setIsLoading(true);
        
        // Получаем данные о команде
        const teamResponse = await fetch(`/api/teams/${id}`);
        if (!teamResponse.ok) {
          throw new Error('Не удалось загрузить данные команды');
        }
        const teamData = await teamResponse.json();
        
        // Устанавливаем данные команды
        setTeamData({
          name: teamData.name,
          description: teamData.description || '',
          coachId: teamData.coach?.id || ''
        });
        
        // Устанавливаем выбранных игроков - получаем ID игроков из teamPlayers
        const playerIds = teamData.teamPlayers?.map((tp: any) => tp.player.id) || [];
        setSelectedPlayers(playerIds);
        
        // Получаем список тренеров
        const coachesResponse = await fetch('/api/users?role=COACH');
        if (!coachesResponse.ok) {
          throw new Error('Не удалось загрузить список тренеров');
        }
        const coachesData = await coachesResponse.json();
        
        // Получаем список игроков
        const playersResponse = await fetch('/api/users?role=PLAYER');
        if (!playersResponse.ok) {
          throw new Error('Не удалось загрузить список игроков');
        }
        const playersData = await playersResponse.json();
        
        // Фильтруем только активных пользователей
        setCoaches(coachesData.filter((coach: any) => coach.isActive));
        setPlayers(playersData.filter((player: any) => player.isActive));
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError('Не удалось загрузить данные для редактирования команды');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamData();
  }, [id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTeamData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePlayerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setSelectedPlayers(selectedOptions);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Формируем данные команды
      const data = {
        ...teamData,
        playerIds: selectedPlayers
      };
      
      // Отправляем запрос на обновление команды
      const response = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить команду');
      }
      
      // Перенаправляем на страницу команды
      router.push(`/admin/teams/${id}`);
    } catch (error) {
      console.error('Ошибка при обновлении команды:', error);
      setError(error instanceof Error ? error.message : 'Не удалось обновить команду');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatUserName = (user: any) => {
    if (user.profile?.firstName || user.profile?.lastName) {
      return `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`;
    }
    return user.email;
  };
  
  // Отображаем состояние загрузки
  if (isLoading) {
    return (
      <RoleProtectedLayout allowedRoles={['ADMIN']}>
        <div className="container mx-auto py-10 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </RoleProtectedLayout>
    );
  }
  
  if (error && !coaches.length && !players.length) {
    return (
      <RoleProtectedLayout allowedRoles={['ADMIN']}>
        <div className="container mx-auto py-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="mr-2" />
            <span>{error}</span>
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
  
  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Редактирование команды</h1>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/teams/${id}`)}
          >
            Отмена
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Информация о команде</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Название команды</label>
                  <Input
                    type="text"
                    name="name"
                    value={teamData.name}
                    onChange={handleChange}
                    required
                    placeholder="Введите название команды"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Тренер</label>
                  <select
                    name="coachId"
                    value={teamData.coachId}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Выберите тренера</option>
                    {coaches.map(coach => (
                      <option key={coach.id} value={coach.coach?.id}>
                        {formatUserName(coach)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  name="description"
                  value={teamData.description}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="Введите описание команды"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Игроки</label>
                <select
                  multiple
                  value={selectedPlayers}
                  onChange={handlePlayerSelect}
                  className="w-full p-2 border border-gray-300 rounded-md h-64"
                >
                  {players.map(player => (
                    <option key={player.id} value={player.player?.id}>
                      {formatUserName(player)} - {formatPlayerPosition(player.player?.position)}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Выберите игроков, удерживая Ctrl (Command для Mac) для множественного выбора
                </p>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push(`/admin/teams/${id}`)}
                  className="mr-3"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleProtectedLayout>
  );
} 