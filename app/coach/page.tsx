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

interface DashboardStats {
  totalPlayers: number;
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

export default function CoachDashboard() {
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
        
        const statsResponse = await fetch('/api/coach/dashboard/stats');
        
        if (!statsResponse.ok) {
          throw new Error(`Ошибка при загрузке статистики: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        const eventsResponse = await fetch('/api/coach/dashboard/events');
        
        if (!eventsResponse.ok) {
          throw new Error(`Ошибка при загрузке событий: ${eventsResponse.status}`);
        }
        
        const eventsData = await eventsResponse.json();
        setUpcomingEvents(eventsData.slice(0, 5));
        
        const chartsResponse = await fetch('/api/coach/dashboard/charts');
        
        if (!chartsResponse.ok) {
          throw new Error(`Ошибка при загрузке данных для графиков: ${chartsResponse.status}`);
        }
        
        const chartsData = await chartsResponse.json();
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

  const prepareChartData = () => {
    if (!chartData) return null;

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

  const chartDataFormatted = prepareChartData();

  return (
    <RoleProtectedLayout allowedRoles={['COACH']}>
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold">Добро пожаловать, {session?.user.firstName || 'Тренер'}!</h1>
          <p className="text-gray-500">
            Здесь вы можете управлять командами и игроками, а также просматривать статистику.
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка данных тренера..." />
          </div>
        ) : (
          <>
            {/* Верхние карточки (статистика) */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Игроки</CardTitle>
                  <UserIcon className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPlayers || 0}</div>
                  <p className="text-xs text-gray-500">в ваших командах</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Команды</CardTitle>
                  <UsersIcon className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTeams || 0}</div>
                  <p className="text-xs text-gray-500">под вашим руководством</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Предстоящие события</CardTitle>
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.upcomingEvents || 0}</div>
                  <p className="text-xs text-gray-500">в ближайшие 30 дней</p>
                </CardContent>
              </Card>
            </div>

            {/* Нижний раздел - Графики результатов матчей и расписания */}
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
              {/* График результатов матчей */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Результаты матчей</CardTitle>
                    <Link href="/coach/stats">
                      <Button variant="outline" size="sm" className="gap-1">
                        <span>Подробная статистика</span>
                        <ChevronRightIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartDataFormatted ? (
                    <div className="w-full h-[400px] overflow-hidden">
                      <BarChart data={chartDataFormatted.teamsMatchesBarData} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                      <TrophyIcon className="w-12 h-12 mb-3 text-gray-400" />
                      <p>Нет данных о матчах</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* График расписания на ближайшие месяцы */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>График событий по месяцам</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartDataFormatted ? (
                    <div className="w-full h-[400px] overflow-hidden">
                      <LineChart data={chartDataFormatted.eventsLineData} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                      <CalendarIcon className="w-12 h-12 mb-3 text-gray-400" />
                      <p>Нет данных о будущих событиях</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ближайшие события - теперь внизу и на всю ширину */}
            <Card className="w-full mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ближайшие события</CardTitle>
                  <Link href="/coach/schedule">
                    <Button variant="outline" size="sm" className="gap-1">
                      <span>Все события</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Событие</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Дата и время</TableHead>
                          <TableHead>Место</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              {event.title}
                              <div className="text-xs text-gray-500">
                                {event.teams.map(team => team.name).join(', ')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                                {getEventTypeName(event.eventType)}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(event.startTime)}</TableCell>
                            <TableCell>{event.location}</TableCell>
                            <TableCell>
                              <Link href={`/schedule/${event.id}`} className="font-medium text-black hover:underline">
                                Подробнее
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Нет предстоящих событий</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RoleProtectedLayout>
  );
} 