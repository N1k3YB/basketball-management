'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';

export default function CreateTeamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для хранения ошибок валидации
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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
    const fetchCoachesAndPlayers = async () => {
      try {
        setIsLoading(true);
        
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
        setError('Не удалось загрузить данные для создания команды');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCoachesAndPlayers();
  }, []);
  
  // Валидация формы
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Проверка названия команды
    if (!teamData.name.trim()) {
      errors.name = 'Название команды обязательно';
    } else if (teamData.name.trim().length < 3) {
      errors.name = 'Название команды должно быть не менее 3 символов';
    }
    
    // Проверка тренера (опционально)
    if (!teamData.coachId && coaches.length > 0) {
      errors.coachId = 'Выберите тренера для команды';
    }
    
    // Проверка игроков (должен быть хотя бы один игрок)
    if (selectedPlayers.length === 0 && players.length > 0) {
      errors.players = 'Выберите хотя бы одного игрока для команды';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTeamData(prev => ({ ...prev, [name]: value }));
    // Сбрасываем ошибку валидации при изменении значения
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const handlePlayerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setSelectedPlayers(selectedOptions);
    // Сбрасываем ошибку валидации при выборе игроков
    setValidationErrors(prev => ({ ...prev, players: '' }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем валидность формы перед отправкой
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Формируем данные команды
      const data = {
        ...teamData,
        playerIds: selectedPlayers
      };
      
      // Отправляем запрос на создание команды
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось создать команду');
      }
      
      // Перенаправляем на страницу команд
      router.push('/admin/teams');
    } catch (error) {
      console.error('Ошибка при создании команды:', error);
      setError(error instanceof Error ? error.message : 'Не удалось создать команду');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatUserName = (user: any) => {
    if (user.profile?.firstName || user.profile?.lastName) {
      return `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`;
    }
    return user.email;
  };
  
  // Отображаем состояние загрузки
  if (isLoading && coaches.length === 0 && players.length === 0) {
    return (
      <RoleProtectedLayout allowedRoles={['ADMIN']}>
        <div className="container mx-auto py-10 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </RoleProtectedLayout>
    );
  }
  
  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Создание новой команды</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/teams')}
          >
            Назад к списку
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
                  <label className="block text-sm font-medium mb-1">Название команды *</label>
                  <Input
                    type="text"
                    name="name"
                    value={teamData.name}
                    onChange={handleChange}
                    required
                    placeholder="Введите название команды"
                    className={validationErrors.name ? "border-red-500" : ""}
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Тренер {coaches.length > 0 ? "*" : ""}</label>
                  <select
                    name="coachId"
                    value={teamData.coachId}
                    onChange={handleChange}
                    className={`w-full p-2 border ${validationErrors.coachId ? "border-red-500" : "border-gray-300"} rounded-md`}
                    required={coaches.length > 0}
                  >
                    <option value="">Выберите тренера</option>
                    {coaches.map(coach => (
                      <option key={coach.id} value={coach.coach?.id}>
                        {formatUserName(coach)}
                      </option>
                    ))}
                  </select>
                  {validationErrors.coachId && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.coachId}</p>
                  )}
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
                <label className="block text-sm font-medium mb-1">Игроки {players.length > 0 ? "*" : ""}</label>
                <select
                  multiple
                  value={selectedPlayers}
                  onChange={handlePlayerSelect}
                  className={`w-full p-2 border ${validationErrors.players ? "border-red-500" : "border-gray-300"} rounded-md h-64`}
                >
                  {players.map(player => (
                    <option key={player.id} value={player.player?.id}>
                      {formatUserName(player)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Удерживайте Ctrl (Cmd на Mac) для выбора нескольких игроков</p>
                {validationErrors.players && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.players}</p>
                )}
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/teams')}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Создание...' : 'Создать команду'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleProtectedLayout>
  );
} 