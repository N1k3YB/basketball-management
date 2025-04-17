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
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface DashboardStats {
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

interface TeamInfo {
  id: string;
  name: string;
  description: string;
  playersCount: number;
}

export default function PlayerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const statsResponse = await fetch('/api/player/dashboard/stats');
        
        if (!statsResponse.ok) {
          throw new Error(`Ошибка при загрузке статистики: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        const eventsResponse = await fetch('/api/player/dashboard/events');
        
        if (!eventsResponse.ok) {
          throw new Error(`Ошибка при загрузке событий: ${eventsResponse.status}`);
        }
        
        const eventsData = await eventsResponse.json();
        setUpcomingEvents(eventsData.slice(0, 5));
        
        const teamsResponse = await fetch('/api/player/teams');
        
        if (!teamsResponse.ok) {
          throw new Error(`Ошибка при загрузке команд: ${teamsResponse.status}`);
        }
        
        const teamsData = await teamsResponse.json();
        setTeams(teamsData.slice(0, 3)); // Отображение только 3 команд на главной странице
        
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

  return (
    <RoleProtectedLayout allowedRoles={['PLAYER']}>
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold">Добро пожаловать, {session?.user.firstName || 'Игрок'}!</h1>
          <p className="text-gray-600">Здесь вы можете просматривать свои команды и расписание тренировок.</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <BasketballSpinner label="Загрузка данных..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
              Попробовать снова
            </Button>
          </div>
        ) : (
          <>
            {/* Секция статистики */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Мои команды
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalTeams || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Предстоящие события
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.upcomingEvents || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Секция моих команд */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Мои команды</h2>
                <Link href="/player/teams">
                  <Button variant="link" className="flex items-center gap-1">
                    Все команды <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {teams.length === 0 ? (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center text-gray-500">
                      <p>У вас пока нет команд</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <Card key={team.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => router.push(`/player/teams/${team.id}`)}>
                      <CardContent className="p-6">
                        <div className="flex flex-col h-full">
                          <h3 className="text-lg font-bold mb-2">{team.name}</h3>
                          <p className="text-gray-500 text-sm mb-4 flex-grow">
                            {team.description || 'Нет описания'}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">{team.playersCount} игроков</span>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Секция ближайших событий */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Ближайшие события</h2>
                <Link href="/player/schedule">
                  <Button variant="link" className="flex items-center gap-1">
                    Всё расписание <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center text-gray-500">
                      <p>Нет предстоящих событий</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Дата и время</TableHead>
                        <TableHead>Место</TableHead>
                        <TableHead>Команды</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingEvents.map((event) => (
                        <TableRow key={event.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/player/schedule/${event.id}`)}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                              {getEventTypeName(event.eventType)}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(event.startTime)}</TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {event.teams?.map(team => team.name).join(', ') || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </RoleProtectedLayout>
  );
} 