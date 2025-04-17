'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  CalendarIcon,
  Search,
} from 'lucide-react';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import BasketballSpinner from '@/components/ui/BasketballSpinner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventType: 'TRAINING' | 'MATCH' | 'MEETING';
  startTime: string;
  endTime: string | null;
  location: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  teams: {
    id: string;
    name: string;
  }[];
}

export default function PlayerSchedulePage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sortField, setSortField] = useState<string>('startTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/player/schedule');
        if (!response.ok) {
          throw new Error('Не удалось загрузить расписание');
        }
        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
        setError('Не удалось загрузить расписание. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = [...events];
    const now = new Date();
    
    // Фильтрация по поисковому запросу
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(term) || 
        (event.description && event.description.toLowerCase().includes(term)) ||
        event.location.toLowerCase().includes(term) ||
        event.teams.some(team => team.name.toLowerCase().includes(term))
      );
    }
    
    // Фильтрация по типу события
    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.eventType === selectedType);
    }
    
    // Фильтрация по времени
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.startTime);
      const isPast = eventDate < now;
      return (activeTab === 'upcoming' && !isPast) || (activeTab === 'past' && isPast);
    });
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedType, activeTab]);

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
    <RoleProtectedLayout allowedRoles={['PLAYER']}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Расписание</h1>
        <p className="text-gray-500 mb-6">
          Ваши тренировки, матчи и другие события команд
        </p>
        
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
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  className="w-full sm:w-[200px] bg-white p-2 border border-gray-300 rounded-md"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                >
                  <option value="all">Все типы</option>
                  <option value="TRAINING">Тренировки</option>
                  <option value="MATCH">Матчи</option>
                  <option value="MEETING">Собрания</option>
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
        
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
                  Попробовать снова
                </Button>
              </div>
            )}
            
            {loading ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <BasketballSpinner label="Загрузка расписания..." />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CalendarIcon className="w-16 h-16 mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-medium text-gray-900">Нет событий</h3>
                <p className="max-w-sm mb-6 text-gray-500">
                  {searchTerm || selectedType !== 'all'
                    ? 'Не найдено событий, соответствующих критериям поиска.'
                    : activeTab === 'upcoming'
                      ? 'У вас нет запланированных событий.'
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEvents.map((event) => (
                      <TableRow 
                        key={event.id} 
                        className="cursor-pointer hover:bg-gray-50"
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
                          {event.endTime && (
                            <div className="text-xs text-gray-500">до {formatDate(event.endTime).split(',')[1]}</div>
                          )}
                        </TableCell>
                        <TableCell>{event.location || '-'}</TableCell>
                        <TableCell>
                          {event.teams.map(team => team.name).join(', ')}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventStatusColor(event.status)}`}>
                            {getEventStatusName(event.status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
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