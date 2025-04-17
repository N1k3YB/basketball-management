'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';

interface Team {
  id: string;
  name: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Состояние для хранения ошибок валидации
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Форма события
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    eventType: 'TRAINING',
    startDate: '',
    startTime: '',
    endTime: '',
    location: '',
    selectedTeamIds: [] as string[],
    status: 'SCHEDULED'
  });
  
  // Данные матча (если тип события - матч)
  const [matchData, setMatchData] = useState({
    awayTeamName: '',
    homeScore: 0,
    awayScore: 0
  });
  
  useEffect(() => {
    // Загружаем список команд
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) {
          throw new Error('Не удалось загрузить список команд');
        }
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error('Ошибка загрузки команд:', error);
        setError('Не удалось загрузить список команд. Пожалуйста, попробуйте снова позже.');
      }
    };
    
    fetchTeams();
  }, []);
  
  // Валидация даты и времени
  const validateDateTime = (startDate: string, startTime: string, endTime: string): boolean => {
    if (!startDate || !startTime || !endTime) {
      return false;
    }
    
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);
    
    // Проверяем только, что время окончания позже времени начала
    return endDateTime > startDateTime;
  };
  
  // Функция валидации формы
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Проверка заголовка
    if (!eventData.title.trim()) {
      errors.title = 'Название события обязательно';
    } else if (eventData.title.trim().length < 3) {
      errors.title = 'Название события должно содержать минимум 3 символа';
    }
    
    // Проверка местоположения
    if (!eventData.location.trim()) {
      errors.location = 'Местоположение обязательно';
    }
    
    // Проверка дат и времени
    if (!eventData.startDate) {
      errors.startDate = 'Дата начала обязательна';
    }
    
    if (!eventData.startTime) {
      errors.startTime = 'Время начала обязательно';
    }
    
    if (!eventData.endTime) {
      errors.endTime = 'Время окончания обязательно';
    }
    
    // Проверка корректности дат и времени
    if (eventData.startDate && eventData.startTime && eventData.endTime) {
      if (!validateDateTime(eventData.startDate, eventData.startTime, eventData.endTime)) {
        errors.dateTime = 'Время окончания должно быть позже времени начала';
      }
    }
    
    // Проверка команд
    if (eventData.selectedTeamIds.length === 0 && teams.length > 0) {
      errors.teams = 'Выберите хотя бы одну команду';
    }
    
    // Проверка специфичных данных для матча
    if (eventData.eventType === 'MATCH') {
      if (!eventData.selectedTeamIds.length || !eventData.selectedTeamIds[0]) {
        errors.teams = 'Для матча необходимо выбрать домашнюю команду';
      }
      
      if (!matchData.awayTeamName.trim()) {
        errors.awayTeamName = 'Название гостевой команды обязательно';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
    // Сбрасываем ошибку валидации при изменении значения
    setValidationErrors(prev => ({ ...prev, [name]: '', dateTime: '' }));
  };
  
  const handleMatchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMatchData(prev => ({ ...prev, [name]: value }));
    // Сбрасываем ошибку валидации при изменении значения
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Для матча берем только одно выбранное значение
    if (eventData.eventType === 'MATCH') {
      const selectedValue = e.target.value;
      setEventData(prev => ({ ...prev, selectedTeamIds: [selectedValue] }));
    } else {
      // Для других типов событий обрабатываем множественный выбор
      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
      setEventData(prev => ({ ...prev, selectedTeamIds: selectedOptions }));
    }
    // Сбрасываем ошибку валидации при выборе команд
    setValidationErrors(prev => ({ ...prev, teams: '' }));
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
      // Формируем даты начала и окончания
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}`);
      const endDateTime = new Date(`${eventData.startDate}T${eventData.endTime}`); // Используем дату начала
      
      // Подготавливаем данные для отправки
      const requestData: any = {
        title: eventData.title,
        description: eventData.description,
        eventType: eventData.eventType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: eventData.location,
        teamIds: eventData.selectedTeamIds,
        status: 'SCHEDULED', // Всегда устанавливаем статус "Запланировано" при создании
        syncData: true // Флаг для автоматической синхронизации
      };
      
      // Добавление информации о матче
      if (eventData.eventType === 'MATCH') {
        const homeTeamId = eventData.selectedTeamIds[0];
        // Если есть гостевая команда, происходит добавление ее названия в описание
        if (matchData.awayTeamName) {
          requestData.description = requestData.description 
            ? `${requestData.description}\nГостевая команда: ${matchData.awayTeamName}`
            : `Гостевая команда: ${matchData.awayTeamName}`;
        }
        
        requestData.match = {
          homeTeamId: homeTeamId, 
          status: 'SCHEDULED',
          homeScore: 0,
          awayScore: 0
        };
      }
      
      // Отправление запроса на создание события
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось создать событие');
      }
      
      // Перенаправление на страницу расписания
      router.push('/admin/schedule');
    } catch (error) {
      console.error('Ошибка при создании события:', error);
      setError(error instanceof Error ? error.message : 'Не удалось создать событие');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Создание нового события</h1>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full p-0"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Данные события</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {/* Отображение общей ошибки валидации дат */}
            {validationErrors.dateTime && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {validationErrors.dateTime}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название события *</label>
                  <Input
                    name="title"
                    value={eventData.title}
                    onChange={handleChange}
                    required
                    className={validationErrors.title ? "border-red-500" : ""}
                  />
                  {validationErrors.title && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <Textarea
                    name="description"
                    value={eventData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Тип события *</label>
                  <select
                    name="eventType"
                    value={eventData.eventType}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="TRAINING">Тренировка</option>
                    <option value="MATCH">Матч</option>
                    <option value="MEETING">Собрание</option>
                    <option value="OTHER">Другое</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Дата начала *</label>
                  <Input
                    type="date"
                    name="startDate"
                    value={eventData.startDate}
                    onChange={handleChange}
                    required
                    className={validationErrors.startDate ? "border-red-500" : ""}
                  />
                  {validationErrors.startDate && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Время начала *</label>
                  <Input
                    type="time"
                    name="startTime"
                    value={eventData.startTime}
                    onChange={handleChange}
                    required
                    className={validationErrors.startTime ? "border-red-500" : ""}
                  />
                  {validationErrors.startTime && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.startTime}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Время окончания *</label>
                <Input
                  type="time"
                  name="endTime"
                  value={eventData.endTime}
                  onChange={handleChange}
                  required
                  className={validationErrors.endTime ? "border-red-500" : ""}
                />
                {validationErrors.endTime && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.endTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Место проведения *</label>
                <Input
                  name="location"
                  value={eventData.location}
                  onChange={handleChange}
                  required
                  className={validationErrors.location ? "border-red-500" : ""}
                />
                {validationErrors.location && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.location}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Команды {teams.length > 0 ? "*" : ""}
                  {eventData.eventType === 'MATCH' && " (выберите домашнюю команду)"}
                </label>
                {eventData.eventType === 'MATCH' ? (
                  <select
                    name="selectedTeams"
                    value={eventData.selectedTeamIds[0] || ''}
                    onChange={handleTeamChange}
                    className={`w-full p-2 border ${validationErrors.teams ? "border-red-500" : "border-gray-300"} rounded-md`}
                  >
                    <option value="">Выберите домашнюю команду</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    multiple
                    name="selectedTeams"
                    value={eventData.selectedTeamIds}
                    onChange={handleTeamChange}
                    className={`w-full p-2 border ${validationErrors.teams ? "border-red-500" : "border-gray-300"} rounded-md h-48`}
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                )}
                {eventData.eventType !== 'MATCH' && (
                  <p className="text-xs text-gray-500 mt-1">Удерживайте Ctrl (Cmd на Mac) для выбора нескольких команд</p>
                )}
                {validationErrors.teams && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.teams}</p>
                )}
              </div>
              
              {/* Дополнительные поля для матча */}
              {eventData.eventType === 'MATCH' && (
                <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium">Информация о матче</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Название гостевой команды *</label>
                    <Input
                      name="awayTeamName"
                      value={matchData.awayTeamName}
                      onChange={handleMatchChange}
                      required
                      placeholder="Введите название гостевой команды"
                      className={validationErrors.awayTeamName ? "border-red-500" : ""}
                    />
                    {validationErrors.awayTeamName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.awayTeamName}</p>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-1">
                    Счет матча и другие детали доступны для заполнения при редактировании события.
                  </p>
                </div>
              )}
              
              <div className="pt-4 flex justify-end space-x-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Создание...' : 'Создать событие'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleProtectedLayout>
  );
} 