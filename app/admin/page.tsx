'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/Table';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import Link from 'next/link';
import { 
  UserIcon, 
  UsersIcon, 
  CalendarIcon, 
  TrophyIcon,
  ChartBarIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { BarChart, PieChart, LineChart } from '@/components/ui/Charts';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

// Типы данных для дашборда
interface DashboardStats {
  totalPlayers: number;
  totalCoaches: number;
  totalTeams: number;
  upcomingEvents: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  eventType: string;
  startTime: string;
  location: string;
  teams: {
    name: string;
  }[];
}

// Типы данных для графиков
interface ChartData {
  teamsMatchesStats: {
    labels: string[];
    wins: number[];
    losses: number[];
    draws: number[];
  };
  teamsPlayersCount: {
    labels: string[];
    playersCount: number[];
  };
  upcomingEventsByMonth: {
    labels: string[];
    training: number[];
    matches: number[];
    meetings: number[];
  };
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Загрузка статистики
        const statsResponse = await fetch('/api/admin/dashboard/stats');
        
        if (!statsResponse.ok) {
          throw new Error(`Ошибка при загрузке статистики: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        // Загрузка ближайших событий
        const eventsResponse = await fetch('/api/admin/dashboard/events');
        
        if (!eventsResponse.ok) {
          throw new Error(`Ошибка при загрузке событий: ${eventsResponse.status}`);
        }
        
        const eventsData = await eventsResponse.json();
        setUpcomingEvents(eventsData.slice(0, 5)); // Берем только 5 ближайших событий
        
        // Загрузка данных для графиков
        const chartsResponse = await fetch('/api/admin/dashboard/charts');
        
        if (!chartsResponse.ok) {
          throw new Error(`Ошибка при загрузке данных для графиков: ${chartsResponse.status}`);
        }
        
        const chartsData = await chartsResponse.json();
        
        // Вывод данных графика событий для отладки
        console.log('Данные графика событий:', chartsData.upcomingEventsByMonth);
        
        setChartData(chartsData);
        
      } catch (error) {
        console.error('Ошибка при загрузке данных для дашборда:', error);
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Форматирование даты
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

  // Получение цвета для типа события
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

  // Получение названия типа события на русском
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

  // Подготовка данных для графиков
  const prepareChartData = () => {
    if (!chartData) return null;

    // Данные для столбчатой диаграммы результатов матчей по командам
    const teamsMatchesBarData = {
      labels: chartData.teamsMatchesStats.labels,
      datasets: [
        {
          label: 'Победы',
          data: chartData.teamsMatchesStats.wins,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1
        },
        {
          label: 'Поражения',
          data: chartData.teamsMatchesStats.losses,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        },
        {
          label: 'Ничьи',
          data: chartData.teamsMatchesStats.draws,
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1
        }
      ]
    };

    // Данные для круговой диаграммы распределения игроков по командам
    const playersDistributionPieData = {
      labels: chartData.teamsPlayersCount.labels,
      datasets: [
        {
          data: chartData.teamsPlayersCount.playersCount,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(14, 165, 233, 1)',
            'rgba(245, 158, 11, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    // Данные для линейного графика предстоящих событий по месяцам
    const eventsLineData = {
      labels: chartData.upcomingEventsByMonth.labels,
      datasets: [
        {
          label: 'Тренировки',
          data: chartData.upcomingEventsByMonth.training,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Матчи',
          data: chartData.upcomingEventsByMonth.matches,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Собрания',
          data: chartData.upcomingEventsByMonth.meetings,
          borderColor: 'rgba(168, 85, 247, 1)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };

    return {
      teamsMatchesBarData,
      playersDistributionPieData,
      eventsLineData
    };
  };

  // Отображение индикатора загрузки
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <BasketballSpinner label="Загрузка данных администратора..." />
      </div>
    );
  }

  // Отображение ошибки, если она есть
  if (error) {
    return (
      <RoleProtectedLayout allowedRoles={['ADMIN']}>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </RoleProtectedLayout>
    );
  }

  const chartDataProcessed = prepareChartData();

  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Добро пожаловать, {session?.user.firstName || 'Администратор'}</h1>
          <p className="text-gray-500">Панель управления системой</p>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Карточка "Весь состав" (объединение игроков и тренеров) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-500 text-sm font-medium">Весь состав</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div>
                    <div className="flex flex-col">
                      <p className="text-3xl font-bold">{stats.totalPlayers + stats.totalCoaches}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          <span className="font-medium text-blue-600">{stats.totalPlayers}</span> игроков
                        </span>
                        <span className="text-xs">•</span>
                        <span className="text-xs text-gray-500">
                          <span className="font-medium text-green-600">{stats.totalCoaches}</span> тренеров
                        </span>
                      </div>
                      <Link 
                        href="/admin/users"
                        className="text-sm text-primary-600 hover:text-primary-800 hover:underline mt-1"
                      >
                        Управление всем составом
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-500 text-sm font-medium">Всего команд</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div>
                    <p className="text-3xl font-bold">{stats.totalTeams}</p>
                    <Link 
                      href="/admin/teams"
                      className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      Управление командами
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-500 text-sm font-medium">Предстоящие события</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div>
                    <p className="text-3xl font-bold">{stats.upcomingEvents}</p>
                    <Link 
                      href="/admin/schedule"
                      className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      Управление расписанием
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Графики */}
        {chartDataProcessed && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600" />
              Аналитика системы
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* График распределения игроков по командам */}
              <PieChart 
                title="Распределение активных игроков по командам" 
                data={chartDataProcessed.playersDistributionPieData}
                height={300}
              />
              
              {/* График результатов матчей по командам */}
              <BarChart 
                title="Результаты матчей команд" 
                data={chartDataProcessed.teamsMatchesBarData}
                height={300}
              />
            </div>
            
            {/* График предстоящих событий по месяцам - на всю ширину */}
            <div className="w-full">
              <LineChart 
                title="График событий на ближайшие 6 месяцев" 
                data={chartDataProcessed.eventsLineData}
                height={300}
                options={{
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: 'Месяцы'
                      }
                    },
                    y: {
                      display: true,
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Количество событий'
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    }
                  },
                  maintainAspectRatio: false
                }}
              />
            </div>
          </div>
        )}

        {/* Ближайшие события */}
        <Card>
          <CardHeader>
            <CardTitle>Ближайшие события</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тип</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Дата и время</TableHead>
                    <TableHead>Место</TableHead>
                    <TableHead>Команда</TableHead>
                    <TableHead>Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                          {getEventTypeName(event.eventType)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{formatDate(event.startTime)}</TableCell>
                      <TableCell>{event.location || 'Не указано'}</TableCell>
                      <TableCell>
                        {event.teams && event.teams.length > 0 
                          ? event.teams.map(team => team.name).join(', ')
                          : 'Нет назначенных команд'
                        }
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/admin/schedule/${event.id}/edit`}
                          className="text-primary hover:underline flex items-center"
                        >
                          Подробнее
                          <ChevronRightIcon className="h-4 w-4 ml-1" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Нет предстоящих событий</p>
                <Button className="mt-4" onClick={() => router.push('/admin/schedule/new')}>
                  Создать событие
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleProtectedLayout>
  );
} 