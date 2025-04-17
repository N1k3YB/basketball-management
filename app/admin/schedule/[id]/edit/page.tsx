'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Label } from '@/components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { AttendanceStatus } from '@prisma/client';
import { extractExternalTeamName } from '@/lib/utils';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface Team {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startTime: string;
  endTime: string;
  location: string | null;
  status: string;
  eventTeams: {
    team: {
      id: string;
      name: string;
      stats?: {
        totalMatches: number;
        wins: number;
        losses: number;
        pointsScored: number;
        pointsConceded: number;
      };
    };
  }[];
  eventPlayers: {
    player: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
      stats?: {
        totalMatches: number;
        points: number;
        rebounds: number;
        assists: number;
        steals: number;
        blocks: number;
        minutesPlayed: number;
      };
      teamPlayers?: Array<{
        teamId: string;
      }>;
    };
    attendance: string;
  }[];
  match?: {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    awayTeamName?: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  } | null;
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  
  // Данные события
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    eventType: '',
    startDate: '',
    startTime: '',
    endTime: '',
    location: '',
    selectedTeamIds: [] as string[],
    status: 'SCHEDULED'
  });
  
  // Данные матча (если тип события - матч)
  const [matchData, setMatchData] = useState({
    homeTeamId: '',
    awayTeamName: '',
    status: 'SCHEDULED',
    homeScore: 0,
    awayScore: 0
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Загрузка события
        const eventResponse = await fetch(`/api/events/${id}`);
        if (!eventResponse.ok) {
          throw new Error('Не удалось загрузить данные события');
        }
        const eventData = await eventResponse.json();
        setEvent(eventData);
        
        // Отладочная информация
        console.log('Загруженные данные события:', eventData);
        console.log('Статус события из API:', eventData.status);
        
        // Загрузка списка команд
        const teamsResponse = await fetch('/api/teams');
        if (!teamsResponse.ok) {
          throw new Error('Не удалось загрузить список команд');
        }
        const teamsData = await teamsResponse.json();
        setTeams(teamsData);
        
        // Форматирование дат для формы
        const startDate = new Date(eventData.startTime);
        const endDate = new Date(eventData.endTime);
        
        // Установка данных события
        setEventData({
          title: eventData.title,
          description: eventData.description || '',
          eventType: eventData.eventType,
          startDate: startDate.toISOString().split('T')[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endTime: endDate.toTimeString().slice(0, 5),
          location: eventData.location || '',
          selectedTeamIds: eventData.eventTeams.map((et: any) => et.team.id),
          status: eventData.status || 'SCHEDULED'
        });
        
        // Отладочная информация для проверки устанавливаемого статуса
        console.log('Установленный статус события в форме:', eventData.status || 'SCHEDULED');
        
        // Если это матч, установка данных матча
        if (eventData.eventType === 'MATCH' && eventData.match) {
          // Извлечение названия гостевой команды из описания
          const awayTeamName = extractExternalTeamName(eventData.description) || '';
          
          setMatchData({
            homeTeamId: eventData.match.homeTeamId,
            awayTeamName: awayTeamName,
            status: eventData.match.status || eventData.status || 'SCHEDULED',
            homeScore: eventData.match.homeScore || 0,
            awayScore: eventData.match.awayScore || 0
          });
        }
      } catch (error: any) {
        console.error('Ошибка загрузки данных:', error);
        setError(error.message || 'Произошла ошибка при загрузке данных');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };
  
  const handleMatchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setMatchData({ ...matchData, [e.target.name]: e.target.value });
  };
  
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setEventData({ ...eventData, selectedTeamIds: selectedOptions });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Проверка, что время окончания позже времени начала
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}`);
      const endDateTime = new Date(`${eventData.startDate}T${eventData.endTime}`);
      
      if (endDateTime <= startDateTime) {
        throw new Error('Время окончания должно быть позже времени начала');
      }
      
      // Проверка, что выбрана только одна команда, если это матч
      if (eventData.eventType === 'MATCH' && eventData.selectedTeamIds.length !== 1) {
        throw new Error('Для матча необходимо выбрать ровно одну домашнюю команду');
      }
      
      // Базовые данные для обновления
      const updateData: any = {
        title: eventData.title,
        description: eventData.description,
        eventType: eventData.eventType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: eventData.location,
        status: eventData.status,
        teamIds: eventData.selectedTeamIds,
        syncData: true // Флаг для автоматической синхронизации
      };
      
      // Если это матч, добавление информации о матче и сохранение названия гостевой команды в описании
      if (eventData.eventType === 'MATCH') {
        // Извлечение текущего названия гостевой команды из описания
        const currentAwayTeamName = extractExternalTeamName(eventData.description);
        
        // Если название изменилось, обновление описания
        if (currentAwayTeamName !== matchData.awayTeamName) {
          // Удаление старой строки с названием команды из описания (если была)
          let newDescription = eventData.description || '';
          if (currentAwayTeamName) {
            newDescription = newDescription.replace(
              `Гостевая команда: ${currentAwayTeamName}`, 
              ''
            ).trim();
          }
          
          // Добавление нового названия команды в описание
          if (matchData.awayTeamName) {
            if (newDescription && !newDescription.endsWith('\n')) {
              newDescription += '\n';
            }
            newDescription += `Гостевая команда: ${matchData.awayTeamName}`;
          }
          
          // Обновление описания в данных для обновления
          updateData.description = newDescription;
        }
        
        updateData.match = {
          homeTeamId: eventData.selectedTeamIds[0], // Использование выбранной команды как домашней
          status: eventData.status, // Использование того же статуса, что выбран для события
          homeScore: parseInt(matchData.homeScore.toString()),
          awayScore: parseInt(matchData.awayScore.toString())
        };
      }
      
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      // Добавление отладочного вывода данных обновления
      console.log('Данные обновления, отправляемые на сервер:', updateData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить событие');
      }
      
      router.push('/admin/schedule');
    } catch (error: any) {
      console.error('Ошибка обновления события:', error);
      setError(error.message || 'Произошла ошибка при обновлении события');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteEvent = async () => {
    if (window.confirm('Вы уверены, что хотите удалить это событие? Это действие нельзя отменить.')) {
      try {
        setIsSubmitting(true);
        
        const response = await fetch(`/api/events/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не удалось удалить событие');
        }
        
        router.push('/admin/schedule');
      } catch (error: any) {
        console.error('Ошибка удаления события:', error);
        setError(error.message || 'Произошла ошибка при удалении события');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  if (isLoading) {
    return (
      <RoleProtectedLayout allowedRoles={['ADMIN', 'COACH']}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <BasketballSpinner label="Загрузка данных..." />
        </div>
      </RoleProtectedLayout>
    );
  }
  
  return (
    <RoleProtectedLayout allowedRoles={['ADMIN', 'COACH']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => router.back()} 
            variant="ghost"
            className="w-10 h-10 flex items-center justify-center rounded-full p-0"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </Button>
          <h1 className="text-2xl font-bold">Редактирование события</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Название события</Label>
                    <Input
                      id="title"
                      name="title"
                      value={eventData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={eventData.description}
                      onChange={handleChange}
                      rows={3}
                    />
                    {eventData.eventType === 'MATCH' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Поле "Гостевая команда" из блока "Информация о матче" будет автоматически добавлено в описание.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="eventType">Тип события</Label>
                    <select
                      id="eventType"
                      name="eventType"
                      value={eventData.eventType}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Выберите тип события</option>
                      <option value="TRAINING">Тренировка</option>
                      <option value="MATCH">Матч</option>
                      <option value="MEETING">Собрание</option>
                      <option value="OTHER">Другое</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Статус события</Label>
                    <select
                      id="status"
                      name="status"
                      value={eventData.status}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="SCHEDULED">Запланировано</option>
                      <option value="IN_PROGRESS">В процессе</option>
                      <option value="COMPLETED">Завершено</option>
                      <option value="CANCELLED">Отменено</option>
                      <option value="POSTPONED">Отложено</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Дата</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={eventData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="startTime">Время начала</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={eventData.startTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endTime">Время окончания</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={eventData.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Место проведения</Label>
                    <Input
                      id="location"
                      name="location"
                      value={eventData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="teams">Команды</Label>
                    <select
                      id="teams"
                      multiple
                      value={eventData.selectedTeamIds}
                      onChange={handleTeamChange}
                      className="w-full p-2 border border-gray-300 rounded-md h-32"
                    >
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Удерживайте Ctrl (⌘ на Mac) для выбора нескольких команд
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Информация о матче (если выбран тип матч) */}
              {eventData.eventType === 'MATCH' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium mb-4">Информация о матче</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="awayTeamName">Гостевая команда</Label>
                      <Input
                        id="awayTeamName"
                        name="awayTeamName"
                        value={matchData.awayTeamName}
                        onChange={handleMatchChange}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Название гостевой команды (будет сохранено в описании события)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="homeScore">Счет домашней команды</Label>
                      <Input
                        id="homeScore"
                        name="homeScore"
                        type="number"
                        min="0"
                        value={matchData.homeScore}
                        onChange={handleMatchChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="awayScore">Счет гостевой команды</Label>
                      <Input
                        id="awayScore"
                        name="awayScore"
                        type="number"
                        min="0"
                        value={matchData.awayScore}
                        onChange={handleMatchChange}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-8">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDeleteEvent}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/schedule')}
                    disabled={isSubmitting}
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleProtectedLayout>
  );
} 