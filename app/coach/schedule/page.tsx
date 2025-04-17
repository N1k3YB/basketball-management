'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { 
  CalendarIcon, 
  EyeIcon, 
  EllipsisHorizontalIcon,
  ClockIcon, 
  PencilIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface Event {
  id: string;
  title: string;
  eventType: 'TRAINING' | 'MATCH' | 'MEETING';
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  teams: {
    id: string;
    name: string;
  }[];
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  eventTeams?: { team: { id: string; name: string } }[];
}

export default function SchedulePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<{id: string, name: string}[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [sortField, setSortField] = useState<string>('startTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!events || !Array.isArray(events)) {
      setFilteredEvents([]);
      return;
    }
    
    const now = new Date();
    
    const filtered = events.filter(event => {
      const matchesSearchTerm = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              event.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEventType = selectedEventType === 'all' || event.eventType === selectedEventType;
      
      const matchesTeam = selectedTeam === 'all' || 
                        (event.teams && Array.isArray(event.teams) && 
                        event.teams.some(team => team.id === selectedTeam));
      
      const eventDate = new Date(event.startTime);
      const isPast = eventDate < now;
      const matchesTimeFilter = (activeTab === 'upcoming' && !isPast) || 
                              (activeTab === 'past' && isPast);
      
      return matchesSearchTerm && matchesEventType && matchesTeam && matchesTimeFilter;
    });
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedEventType, selectedTeam, activeTab]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/coach/events');
        
        if (!response.ok) {
          throw new Error(`Ошибка при загрузке событий: ${response.status}`);
        }
        
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Ошибка при загрузке событий:', error);
        setError('Не удалось загрузить список событий. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/coach/teams');
        
        if (!response.ok) {
          throw new Error(`Ошибка при загрузке команд: ${response.status}`);
        }
        
        const data = await response.json();
        if (Array.isArray(data)) {
          setTeams(data.map(({id, name}: {id: string, name: string}) => ({id, name})));
        } else {
          setTeams([]);
          console.error('Получены неверные данные команд:', data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке команд:', error);
        setTeams([]);
      }
    };

    fetchEvents();
    fetchTeams();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getEventTypeColor = (eventType: string): string => {
    switch (eventType) {
      case 'TRAINING':
        return 'bg-green-100 text-green-800';
      case 'MATCH':
        return 'bg-blue-100 text-blue-800';
      case 'MEETING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeName = (eventType: string): string => {
    switch (eventType) {
      case 'TRAINING':
        return 'Тренировка';
      case 'MATCH':
        return 'Матч';
      case 'MEETING':
        return 'Собрание';
      default:
        return 'Другое';
    }
  };

  const getEventStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventStatusName = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'Запланировано';
      case 'COMPLETED':
        return 'Завершено';
      case 'CANCELLED':
        return 'Отменено';
      default:
        return 'Неизвестно';
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let valueA: any;
    let valueB: any;
    switch (sortField) {
      case 'title':
        valueA = a.title;
        valueB = b.title;
        break;
      case 'eventType':
        valueA = a.eventType;
        valueB = b.eventType;
        break;
      case 'startTime':
        valueA = new Date(a.startTime).getTime();
        valueB = new Date(b.startTime).getTime();
        break;
      case 'location':
        valueA = a.location || '';
        valueB = b.location || '';
        break;
      case 'status':
        valueA = a.status;
        valueB = b.status;
        break;
      default:
        valueA = new Date(a.startTime).getTime();
        valueB = new Date(b.startTime).getTime();
    }
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }
    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
  });

  return (
    <RoleProtectedLayout allowedRoles={['COACH']}>
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Расписание</h1>
            <p className="text-gray-500">
              Управление тренировками, матчами и другими событиями для ваших команд.
            </p>
          </div>
          <Button
            onClick={() => router.push('/coach/schedule/create')}
            className="flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Добавить тренировку
          </Button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Input
                  placeholder="Поиск событий..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  className="w-full sm:w-[200px] bg-white p-2 border border-gray-300 rounded-md"
                  value={selectedEventType}
                  onChange={e => setSelectedEventType(e.target.value)}
                >
                  <option value="all">Все типы</option>
                  <option value="TRAINING">Тренировки</option>
                  <option value="MATCH">Матчи</option>
                  <option value="MEETING">Собрания</option>
                </select>

                <select
                  className="w-full sm:w-[200px] bg-white p-2 border border-gray-300 rounded-md"
                  value={selectedTeam}
                  onChange={e => setSelectedTeam(e.target.value)}
                >
                  <option value="all">Все команды</option>
                  {teams && teams.length > 0 && teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="grid w-full grid-cols-2 rounded-lg overflow-hidden">
                <button 
                  type="button"
                  className={`py-2 text-center ${activeTab === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab('upcoming')}>
                  Предстоящие
                </button>
                <button 
                  type="button"
                  className={`py-2 text-center ${activeTab === 'past' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab('past')}>
                  Прошедшие
                </button>
              </div>
            </div>

            {loading ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <BasketballSpinner label="Загрузка расписания..." />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CalendarIcon className="w-16 h-16 mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-medium text-gray-900">Нет событий</h3>
                <p className="max-w-sm mb-6 text-gray-500">
                  {searchTerm || selectedEventType !== 'all' || selectedTeam !== 'all'
                    ? 'Не найдено событий, соответствующих критериям поиска.'
                    : activeTab === 'upcoming'
                      ? 'У вас нет запланированных событий. Создайте новое событие, чтобы начать.'
                      : 'У вас нет прошедших событий.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => handleSort('title')} className="cursor-pointer">Название {getSortIcon('title')}</TableHead>
                      <TableHead onClick={() => handleSort('eventType')} className="cursor-pointer">Тип {getSortIcon('eventType')}</TableHead>
                      <TableHead onClick={() => handleSort('startTime')} className="cursor-pointer">Дата и время {getSortIcon('startTime')}</TableHead>
                      <TableHead onClick={() => handleSort('location')} className="cursor-pointer">Место проведения {getSortIcon('location')}</TableHead>
                      <TableHead>Команды</TableHead>
                      <TableHead onClick={() => handleSort('status')} className="cursor-pointer">Статус {getSortIcon('status')}</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEvents.map((event) => {
                      let teamsList = event.teams && event.teams.length > 0 ? event.teams : (event.eventTeams ? event.eventTeams.map((et: any) => et.team) : []);
                      return (
                        <TableRow 
                          key={event.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/schedule/${event.id}`)}
                        >
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                              {getEventTypeName(event.eventType)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>{formatDate(event.startTime)}</div>
                            <div className="text-xs text-gray-500">до {formatDate(event.endTime).split(',')[1]}</div>
                          </TableCell>
                          <TableCell>{event.location || '-'}</TableCell>
                          <TableCell>
                            {teamsList.length > 0
                              ? teamsList.map((team: any) => team.name).join(', ')
                              : 'Нет команд'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventStatusColor(event.status)}`}>
                              {getEventStatusName(event.status)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {event.eventType === 'TRAINING' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Редактировать тренировку"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(`/coach/schedule/${event.id}/edit`);
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleProtectedLayout>
  );
}