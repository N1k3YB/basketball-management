'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { Plus, Search, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@/components/ui/Pagination';
import { updateURLParams, useUrlParams } from '@/lib/urlParams';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

export default function TeamsPage() {
  const router = useRouter();
  const urlParams = useUrlParams();
  const [teams, setTeams] = useState<any[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(urlParams.getParam('search', ''));
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: urlParams.getParam('sortKey', 'name'),
    direction: urlParams.getParam('sortDir', 'ascending') as 'ascending' | 'descending'
  });
  const [currentPage, setCurrentPage] = useState(urlParams.getNumParam('page', 1));
  const itemsPerPage = 10;
  const [coachFilter, setCoachFilter] = useState('all');
  
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/teams');
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить список команд');
        }
        
        const data = await response.json();
        setTeams(data);
        setFilteredTeams(data);
      } catch (error) {
        console.error('Ошибка при загрузке команд:', error);
        setError('Не удалось загрузить список команд');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeams();
  }, []);
  
  useEffect(() => {
    // Сохраняем параметры в URL
    updateURLParams(router, {
      search: searchTerm || null,
      sortKey: sortConfig.key !== 'name' ? sortConfig.key : null,
      sortDir: sortConfig.direction !== 'ascending' ? sortConfig.direction : null,
      page: currentPage !== 1 ? currentPage : null,
    });
  }, [searchTerm, sortConfig, currentPage, router]);
  
  useEffect(() => {
    // Получаем список тренеров без дубликатов
    const coaches = Array.from(
      teams.reduce((acc, team) => {
        if (team.coach && team.coach.user) {
          const id = team.coach.user.id;
          const name = team.coach.user.profile?.firstName || team.coach.user.profile?.lastName
            ? `${team.coach.user.profile?.firstName || ''} ${team.coach.user.profile?.lastName || ''}`.trim()
            : team.coach.user.email;
          acc.set(id, { id, name });
        }
        return acc;
      }, new Map())
      .values()
    );
    
    // Фильтрация по поисковому запросу и тренеру
    const filtered = teams.filter(team => {
      const matchesSearch =
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (team.coach?.user?.profile?.firstName && team.coach.user.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (team.coach?.user?.profile?.lastName && team.coach.user.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCoach = coachFilter === 'all' || (team.coach && team.coach.user && team.coach.user.id === coachFilter);
      return matchesSearch && matchesCoach;
    });
    
    // Сортировка
    const sortedFiltered = [...filtered].sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'ascending'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortConfig.key === 'playersCount') {
        const countA = a.teamPlayers?.length || 0;
        const countB = b.teamPlayers?.length || 0;
        return sortConfig.direction === 'ascending'
          ? countA - countB
          : countB - countA;
      } else if (sortConfig.key === 'coach') {
        const coachA = a.coach?.user?.profile?.lastName || '';
        const coachB = b.coach?.user?.profile?.lastName || '';
        return sortConfig.direction === 'ascending'
          ? coachA.localeCompare(coachB)
          : coachB.localeCompare(coachA);
      }
      return 0;
    });
    
    setFilteredTeams(sortedFiltered);
  }, [searchTerm, teams, sortConfig, coachFilter]);
  
  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    // Сбрасываем на первую страницу при изменении сортировки
    setCurrentPage(1);
  };
  
  const formatCoachName = (team: any) => {
    if (!team.coach?.user) return 'Не назначен';
    
    const coach = team.coach.user;
    if (coach.profile?.firstName || coach.profile?.lastName) {
      return `${coach.profile?.firstName || ''} ${coach.profile?.lastName || ''}`.trim();
    }
    return coach.email;
  };
  
  const SortIcon = ({ dataKey }: { dataKey: string }) => {
    if (sortConfig.key !== dataKey) {
      return <ChevronDown className="h-4 w-4 opacity-50" />;
    }
    
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };
  
  // Функция для форматирования статуса команды
  const formatTeamStatus = (team: any) => {
    return team.isActive === false ? 'Неактивна' : 'Активна';
  };

  // Функция для определения класса статуса
  const getStatusClass = (team: any) => {
    return team.isActive === false ? 'status-inactive' : 'status-active';
  };

  // Функция для отображения типа команды в виде бейджа
  const formatTeamType = (team: any) => {
    if (!team.type) return 'Основная';
    
    switch(team.type.toLowerCase()) {
      case 'youth':
      case 'молодежная':
        return 'Молодежная';
      case 'junior':
      case 'юношеская':
        return 'Юношеская';
      case 'kids':
      case 'детская':
        return 'Детская';
      case 'womens':
      case 'женская':
        return 'Женская';
      case 'reserve':
      case 'резервная':
        return 'Резервная';
      case 'mans':
      case 'мужская':
        return 'Мужская';
      default:
        return team.type || 'Основная';
    }
  };

  // Пагинация
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice(
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
          <h1 className="text-2xl font-bold">Управление командами</h1>
          <Button 
            onClick={() => router.push('/admin/teams/create')}
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Создать команду
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Поиск по названию, описанию или тренеру"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Сбрасываем на первую страницу при изменении поиска
              }}
              className="pl-8"
            />
          </div>
          <div>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={coachFilter}
              onChange={e => { setCoachFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Все тренеры</option>
              {Array.from(
                teams.reduce((acc, team) => {
                  if (team.coach && team.coach.user) {
                    const id = team.coach.user.id;
                    const name = team.coach.user.profile?.firstName || team.coach.user.profile?.lastName
                      ? `${team.coach.user.profile?.firstName || ''} ${team.coach.user.profile?.lastName || ''}`.trim()
                      : team.coach.user.email;
                    acc.set(id, { id, name });
                  }
                  return acc;
                }, new Map())
                .values()
              ).map((coach) => {
                const c = coach as { id: string; name: string };
                return <option key={c.id} value={c.id}>{c.name}</option>;
              })}
            </select>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              className="mt-2"
            >
              Попробовать снова
            </Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка команд..." />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              {searchTerm 
                ? 'Не найдено команд, соответствующих поисковому запросу' 
                : 'Нет доступных команд'}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Сбросить поиск
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button 
                      onClick={() => handleSort('name')}
                      className="flex items-center text-sm font-medium"
                    >
                      Название
                      <SortIcon dataKey="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button 
                      onClick={() => handleSort('coach')}
                      className="flex items-center text-sm font-medium"
                    >
                      Тренер
                      <SortIcon dataKey="coach" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button 
                      onClick={() => handleSort('playersCount')}
                      className="flex items-center text-sm font-medium"
                    >
                      Игроки
                      <SortIcon dataKey="playersCount" />
                    </button>
                  </TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeams.map((team) => (
                  <TableRow 
                    key={team.id} 
                    className="hover:bg-gray-50 cursor-pointer" 
                    onClick={() => router.push(`/admin/teams/${team.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div>{team.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[300px]">
                        {team.description || 'Нет описания'}
                      </div>
                    </TableCell>
                    <TableCell>{formatCoachName(team)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1.5 text-gray-500" />
                        <span>{team.teamPlayers?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="badge badge-role">
                        {formatTeamType(team)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`status-badge ${getStatusClass(team)}`}>
                        {formatTeamStatus(team)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/teams/${team.id}/edit`);
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
                            if (window.confirm('Вы уверены, что хотите удалить эту команду?')) {
                              fetch(`/api/teams/${team.id}`, { method: 'DELETE' })
                                .then(response => {
                                  if (response.ok) {
                                    setTeams(teams.filter(t => t.id !== team.id));
                                  } else {
                                    return response.json().then(data => {
                                      throw new Error(data.message || 'Не удалось удалить команду');
                                    });
                                  }
                                })
                                .catch(error => {
                                  console.error('Ошибка при удалении команды:', error);
                                  
                                  // Более универсальная обработка ошибок внешнего ключа
                                  let errorMessage = 'Не удалось удалить команду';
                                  
                                  // Проверка на разные типы нарушений внешнего ключа
                                  if (error.message.includes('Foreign key constraint')) {
                                    if (error.message.includes('matches_homeTeamId_fkey') || 
                                        error.message.includes('matches_awayTeamId_fkey')) {
                                      errorMessage = 'Невозможно удалить команду, так как она участвует в матчах. Сначала удалите все связанные матчи.';
                                    } else if (error.message.includes('TeamStats_teamId_fkey')) {
                                      errorMessage = 'Невозможно удалить команду, так как для неё существует статистика. Сначала удалите статистику команды.';
                                    } else if (error.message.includes('teamId_fkey')) {
                                      errorMessage = 'Невозможно удалить команду, так как она связана с другими записями в системе.';
                                    } else {
                                      errorMessage = 'Невозможно удалить команду из-за зависимостей в базе данных. Сначала удалите все связанные записи.';
                                    }
                                  }
                                  
                                  setError(errorMessage);
                                  
                                  // Скроем сообщение об ошибке через 8 секунд (увеличил время для чтения)
                                  setTimeout(() => setError(null), 8000);
                                });
                            }
                          }}
                          title="Удалить"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Компонент пагинации */}
        {!isLoading && filteredTeams.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
        
        {/* Информация о количестве найденных команд */}
        {!isLoading && filteredTeams.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Найдено команд: {filteredTeams.length}
          </div>
        )}
      </div>
    </RoleProtectedLayout>
  );
} 