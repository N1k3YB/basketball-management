'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { formatPlayerPosition } from '@/lib/utils';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Player {
  id: string;
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  position: string;
  jerseyNumber: number | null;
  inTeam: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
}

export default function TeamPlayersPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const teamId = params.id;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Запрос данных о команде
        const teamResponse = await fetch(`/api/teams/${teamId}`);
        if (!teamResponse.ok) {
          throw new Error(`Ошибка при получении данных о команде: ${teamResponse.status}`);
        }
        const teamData = await teamResponse.json();
        setTeam(teamData);
        
        // Запрос данных о всех игроках с отметкой о принадлежности к команде
        const playersResponse = await fetch(`/api/players?withTeamStatus=${teamId}`);
        if (!playersResponse.ok) {
          throw new Error(`Ошибка при получении данных об игроках: ${playersResponse.status}`);
        }
        const playersData = await playersResponse.json();
        setPlayers(playersData);
        
        setError(null);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  const handleAddToTeam = async (playerId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при добавлении игрока в команду');
      }

      // Обновляем список игроков
      setPlayers(players.map(player => 
        player.id === playerId 
          ? { ...player, inTeam: true } 
          : player
      ));
    } catch (error) {
      console.error('Ошибка при добавлении игрока в команду:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при добавлении игрока в команду');
    }
  };

  const handleRemoveFromTeam = async (playerId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении игрока из команды');
      }

      // Обновляем список игроков
      setPlayers(players.map(player => 
        player.id === playerId 
          ? { ...player, inTeam: false } 
          : player
      ));
    } catch (error) {
      console.error('Ошибка при удалении игрока из команды:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при удалении игрока из команды');
    }
  };

  // Функция фильтрации игроков
  const filteredPlayers = players.filter(player => {
    const playerName = `${player.user.profile.firstName} ${player.user.profile.lastName}`.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    return playerName.includes(searchTermLower) || 
           (player.position && player.position.toLowerCase().includes(searchTermLower));
  });

  return (
    <RoleProtectedLayout allowedRoles={['ADMIN', 'COACH']}>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2"
            onClick={() => router.push('/admin/teams')}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Назад к списку команд</span>
          </Button>
          <h1 className="text-2xl font-bold">
            {loading ? 'Загрузка...' : team ? `Состав команды "${team.name}"` : 'Команда не найдена'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="Поиск по имени или позиции"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Управление составом</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredPlayers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Игрок</TableHead>
                        <TableHead>Позиция</TableHead>
                        <TableHead>Номер</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            <Link 
                              href={`/admin/players/${player.id}`}
                              className="hover:text-primary-600 hover:underline"
                            >
                              {player.user.profile.firstName} {player.user.profile.lastName}
                            </Link>
                          </TableCell>
                          <TableCell>{formatPlayerPosition(player.position)}</TableCell>
                          <TableCell>{player.jerseyNumber || '-'}</TableCell>
                          <TableCell>
                            {player.inTeam ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                В команде
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Не в команде
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {player.inTeam ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => handleRemoveFromTeam(player.id)}
                                title="Удалить из команды"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-800"
                                onClick={() => handleAddToTeam(player.id)}
                                title="Добавить в команду"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    {searchTerm ? (
                      <p>Нет игроков, соответствующих критериям поиска</p>
                    ) : (
                      <p>В системе нет доступных игроков</p>
                    )}
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