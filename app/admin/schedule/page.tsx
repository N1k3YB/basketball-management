'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  formatDateTime, 
  formatEventType,
  formatMatchStatus,
  formatEventStatus
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@/components/ui/Pagination';
import { updateURLParams, useUrlParams } from '@/lib/urlParams';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface Event {
  id: string;
  title: string;
  eventType: 'TRAINING' | 'MATCH' | 'MEETING' | 'OTHER';
  startTime: string;
  endTime: string;
  location?: string;
  match?: {
    id: string;
    homeTeam: {
      id: string;
      name: string;
    };
    awayTeam: {
      id: string;
      name: string;
    };
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
    homeScore?: number;
    awayScore?: number;
  };
  eventTeams: Array<{
    team: {
      id: string;
      name: string;
    };
  }>;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
}

export default function ScheduleManagementPage() {
  const router = useRouter();
  const urlParams = useUrlParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(urlParams.getParam('search', ''));
  const [typeFilter, setTypeFilter] = useState(urlParams.getParam('type', ''));
  const [dateFilter, setDateFilter] = useState(urlParams.getParam('date', ''));
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(urlParams.getNumParam('page', 1));
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState(urlParams.getParam('sortField', 'startTime'));
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(urlParams.getParam('sortDir', 'asc') as 'asc' | 'desc');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/events');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setEvents(data);
        setError(null);
      } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        setError('Не удалось загрузить расписание. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Сохраняем состояние фильтров и пагинации в URL
    updateURLParams(router, {
      search: searchTerm || null,
      type: typeFilter || null,
      date: dateFilter || null,
      page: currentPage !== 1 ? currentPage : null,
      sortField: sortField !== 'startTime' ? sortField : null,
      sortDir: sortDirection !== 'asc' ? sortDirection : null,
    });
  }, [searchTerm, typeFilter, dateFilter, currentPage, sortField, sortDirection, router]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить это событие?')) {
      try {
        const response = await fetch(`/api/events/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Обновляем состояние после удаления
        setEvents(events.filter(event => event.id !== id));
      } catch (error) {
        console.error('Ошибка удаления события:', error);
        alert('Не удалось удалить событие. Пожалуйста, попробуйте позже.');
      }
    }
  };

  // Функция для сортировки
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // Сбрасываем страницу на первую при изменении сортировки
    setCurrentPage(1);
  };

  // Функция для отображения иконки сортировки
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Функция фильтрации событий
  const filteredEvents = events.filter(event => {
    const titleMatch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const teamMatch = event.eventTeams.some(et => 
      et.team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const typeMatch = typeFilter === '' || event.eventType === typeFilter;
    
    // Фильтр по дате
    let dateMatch = true;
    if (dateFilter) {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      dateMatch = eventDate === dateFilter;
    }
    
    return (titleMatch || locationMatch || teamMatch) && typeMatch && dateMatch;
  });

  // Сортировка событий
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortField) {
      case 'title':
        valueA = a.title;
        valueB = b.title;
        break;
      case 'type':
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
      return sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return sortDirection === 'asc'
      ? valueA - valueB
      : valueB - valueA;
  });

  // Пагинация
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);
  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Прокручиваем к верху страницы при переключении
    window.scrollTo(0, 0);
  };

  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Расписание</h1>
          <Button 
            onClick={() => router.push('/admin/schedule/create')}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Добавить событие
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Поиск по названию, месту или команде"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Сбрасываем на первую страницу при изменении поиска
              }}
            />
          </div>
          <div>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1); // Сбрасываем на первую страницу при фильтрации
              }}
            >
              <option value="">Все типы событий</option>
              <option value="TRAINING">Тренировка</option>
              <option value="MATCH">Матч</option>
              <option value="MEETING">Собрание</option>
              <option value="OTHER">Другое</option>
            </select>
          </div>
          <div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1); // Сбрасываем на первую страницу при изменении даты
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка расписания..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              className="mt-2"
            >
              Попробовать снова
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('title')} className="cursor-pointer">
                    Название {getSortIcon('title')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('type')} className="cursor-pointer">
                    Тип {getSortIcon('type')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('startTime')} className="cursor-pointer">
                    Дата и время {getSortIcon('startTime')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('location')} className="cursor-pointer">
                    Место проведения {getSortIcon('location')}
                  </TableHead>
                  <TableHead>Команда</TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                    Статус {getSortIcon('status')}
                  </TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.length > 0 ? (
                  paginatedEvents.map((event) => (
                    <TableRow 
                      key={event.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/schedule/${event.id}`)}
                    >
                      <TableCell className="font-medium">
                        {event.title}
                      </TableCell>
                      <TableCell>{formatEventType(event.eventType)}</TableCell>
                      <TableCell>
                        <div>{formatDateTime(event.startTime)}</div>
                        <div className="text-xs text-gray-500">
                          до {formatDateTime(event.endTime).split(',')[1]}
                        </div>
                      </TableCell>
                      <TableCell>{event.location || '-'}</TableCell>
                      <TableCell>
                        {event.eventTeams.length > 0
                          ? event.eventTeams.map(et => et.team.name).join(', ')
                          : 'Нет команд'}
                      </TableCell>
                      <TableCell>
                        {event.match ? (
                          <div>
                            <div className={`
                              status-badge ${
                                event.status === 'COMPLETED' ? 'status-active' :
                                event.status === 'CANCELLED' ? 'status-inactive' :
                                event.status === 'IN_PROGRESS' ? 'status-pending' : 'status-pending'
                              }
                            `}>
                              {formatEventStatus(event.status)}
                            </div>
                            {event.match.homeScore !== undefined && event.match.awayScore !== undefined && (
                              <div className="text-sm mt-1">
                                {event.match.homeScore} : {event.match.awayScore}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`
                            status-badge ${
                              event.status === 'COMPLETED' ? 'status-active' :
                              event.status === 'CANCELLED' ? 'status-inactive' :
                              event.status === 'IN_PROGRESS' ? 'status-pending' : 'status-pending'
                            }
                          `}>
                            {formatEventStatus(event.status)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/schedule/${event.id}/edit`);
                            }}
                            title="Редактировать"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(event.id);
                            }}
                            title="Удалить"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Нет событий, соответствующих критериям поиска
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Компонент пагинации */}
        {!loading && !error && sortedEvents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
        
        {/* Информация о количестве найденных событий */}
        {!loading && !error && sortedEvents.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Найдено событий: {sortedEvents.length}
          </div>
        )}
      </div>
    </RoleProtectedLayout>
  );
}