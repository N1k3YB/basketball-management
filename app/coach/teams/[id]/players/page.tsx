'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  XMarkIcon,
  EyeSlashIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface Player {
  id: string;
  position: string | null;
  jerseyNumber: number | null;
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    };
  };
  inTeam: boolean;
  isActiveInTeam: boolean | null;
  globalIsActive: boolean;
  currentTeam: {
    id: string;
    name: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
}

export default function TeamPlayersPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const teamId = params.id;
  const { data: session } = useSession();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCoachTeam, setIsCoachTeam] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const teamResponse = await fetch(`/api/teams/${teamId}`);
        if (!teamResponse.ok) {
          throw new Error(`Ошибка при получении данных о команде: ${teamResponse.status}`);
        }
        const teamData = await teamResponse.json();
        setTeam(teamData);
        setIsCoachTeam(!!teamData.isCoachTeam);

        const teamPlayersResponse = await fetch(`/api/teams/${teamId}/players`);
        if (!teamPlayersResponse.ok) {
          throw new Error(`Ошибка при получении игроков команды: ${teamPlayersResponse.status}`);
        }
        const teamPlayersData: Player[] = await teamPlayersResponse.json();

        const otherPlayersResponse = await fetch(`/api/players?excludeTeamId=${teamId}`);
        if (!otherPlayersResponse.ok) {
          throw new Error(`Ошибка при получении остальных игроков: ${otherPlayersResponse.status}`);
        }
        const otherPlayersData: Player[] = await otherPlayersResponse.json();

        const allPlayers = [...teamPlayersData, ...otherPlayersData];
        setPlayers(allPlayers);

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
      if (!isCoachTeam) {
        alert('У вас нет прав на управление этой командой');
        return;
      }
      
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

      setPlayers(players.map(player => 
        player.id === playerId 
          ? { 
              ...player, 
              inTeam: true, 
              currentTeam: { id: teamId, name: team?.name || '' },
              isActiveInTeam: true
            } 
          : player
      ));
    } catch (error) {
      console.error('Ошибка при добавлении игрока в команду:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при добавлении игрока в команду');
    }
  };

  const handleDeactivateInTeam = async (playerId: string) => {
    try {
      if (!isCoachTeam) {
        alert('У вас нет прав на управление этой командой');
        return;
      }
      
      const response = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при переводе игрока в запас');
      }

      setPlayers(prevPlayers => prevPlayers.map(p => 
        p.id === playerId ? { ...p, isActiveInTeam: false, inTeam: true } : p
      ));
    } catch (error) {
      console.error('Ошибка при переводе игрока в запас:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при переводе игрока в запас');
    }
  };
  
  const handleActivateInTeam = async (playerId: string) => {
    try {
      if (!isCoachTeam) {
        alert('У вас нет прав на управление этой командой');
        return;
      }
      
      const response = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при возвращении игрока из запаса');
      }

      setPlayers(prevPlayers => prevPlayers.map(p => 
        p.id === playerId ? { ...p, isActiveInTeam: true, inTeam: true } : p
      ));
    } catch (error) {
      console.error('Ошибка при возвращении игрока из запаса:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при возвращении игрока из запаса');
    }
  };

  const handleRemoveFromTeam = async (playerId: string) => {
    if (!confirm('Вы уверены, что хотите полностью удалить этого игрока из команды? Это действие необратимо.')) {
        return;
    }

    try {
      if (!isCoachTeam) {
        alert('У вас нет прав на управление этой командой');
        return;
      }
      
      const response = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert('Игрок уже удален или не найден в команде.');
          setPlayers(prevPlayers => prevPlayers.map(p => 
             p.id === playerId ? { ...p, inTeam: false, isActiveInTeam: null, currentTeam: null } : p
          ));
          return; 
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении игрока из команды');
      }

      setPlayers(prevPlayers => prevPlayers.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              inTeam: false, 
              isActiveInTeam: null,
              currentTeam: null
            } 
          : p
      ));
    } catch (error) {
      console.error('Ошибка при удалении игрока из команды:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при удалении игрока из команды');
    }
  };

  const handleTogglePlayerStatus = async (playerId: string, currentGlobalStatus: boolean) => {
    try {
      if (!isCoachTeam && !(session?.user?.role?.toUpperCase() === 'ADMIN')) { 
        alert('У вас нет прав на изменение статуса игроков');
        return;
      }
      
      const response = await fetch(`/api/players/${playerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isActive: !currentGlobalStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при изменении статуса игрока');
      }
      const { isActive: newGlobalStatus } = await response.json();

      setPlayers(players.map(p => 
        p.id === playerId 
          ? { ...p, globalIsActive: newGlobalStatus } 
          : p
      ));
    } catch (error) {
      console.error('Ошибка при изменении статуса игрока:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при изменении статуса игрока');
    }
  };

  const categorizedPlayers = useMemo(() => {
      const filtered = players.filter(player => {
          const playerName = `${player.user.profile.firstName} ${player.user.profile.lastName}`.toLowerCase();
          const searchTermLower = searchTerm.toLowerCase();
          const position = player.position?.toLowerCase() ?? '';
          return playerName.includes(searchTermLower) || position.includes(searchTermLower);
      });

      const sortByName = (a: Player, b: Player) => 
        `${a.user.profile.lastName} ${a.user.profile.firstName}`.localeCompare(
          `${b.user.profile.lastName} ${b.user.profile.firstName}`
        );

      const activeInTeam = filtered.filter(p => p.inTeam && p.isActiveInTeam === true).sort(sortByName);
      const inactiveInTeam = filtered.filter(p => p.inTeam && p.isActiveInTeam === false).sort(sortByName);

      const notInCurrentTeam = filtered.filter(p => !p.inTeam);
      const freeActive = notInCurrentTeam.filter(p => !p.currentTeam && p.globalIsActive).sort(sortByName);
      const freeInactive = notInCurrentTeam.filter(p => !p.currentTeam && !p.globalIsActive).sort(sortByName);
      const inOtherTeams = notInCurrentTeam.filter(p => p.currentTeam).sort(sortByName);

      return {
          activeInTeam,
          inactiveInTeam,
          freeActive,
          freeInactive,
          inOtherTeams
      };
  }, [players, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <BasketballSpinner label="Загрузка игроков..." />
      </div>
    );
  }

  if (error) {
    return (
      <RoleProtectedLayout allowedRoles={['COACH', 'ADMIN']}>
        <div className="container mx-auto py-10">
          <p className="text-red-600">{error}</p>
        </div>
      </RoleProtectedLayout>
    );
  }

  if (!team) {
    return (
      <RoleProtectedLayout allowedRoles={['COACH', 'ADMIN']}>
        <div className="container mx-auto py-10">
          <p>Команда не найдена.</p>
        </div>
      </RoleProtectedLayout>
    );
  }

  const renderPlayerRow = (player: Player, actions: React.ReactNode) => (
      <TableRow key={player.id}>
          <TableCell>
              <Link href={`/profile/${player.user.id}`} className="hover:underline">
                  {`${player.user.profile.firstName} ${player.user.profile.lastName}`}
              </Link>
          </TableCell>
          <TableCell>{player.user.email}</TableCell>
          <TableCell>{player.position ? formatPlayerPosition(player.position) : '-'}</TableCell>
          <TableCell className="text-right">{actions}</TableCell>
      </TableRow>
  );

  const renderPlayerTable = (title: string, playersToList: Player[], renderActions: (player: Player) => React.ReactNode) => (
      playersToList.length > 0 && (
          <Card className="mb-6 shadow-md">
              <CardHeader>
                  <CardTitle>{title} ({playersToList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Имя</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Позиция</TableHead>
                              <TableHead className="text-right">Действия</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {playersToList.map(player => renderPlayerRow(player, renderActions(player)))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
      )
  );

  return (
    <RoleProtectedLayout allowedRoles={['COACH']}> 
      <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            className="w-10 h-10 flex items-center justify-center rounded-full p-0"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </Button>
          <h1 className="text-2xl font-bold text-center flex-1">Управление игроками команды "{team?.name || '...'}"</h1>
          <div className="w-24"></div> 
        </div>

        <div className="mb-6">
          <Input 
            type="text" 
            placeholder="Поиск по имени или позиции..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 lg:w-1/3"
          />
        </div>

        {renderPlayerTable('Активные игроки команды', categorizedPlayers.activeInTeam, (player) => (
            <div className="flex justify-end">
              <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-yellow-600 border-yellow-400 hover:bg-yellow-50 hover:text-yellow-700"
                  onClick={() => handleDeactivateInTeam(player.id)}
                  disabled={!isCoachTeam}
                  title="Перевести в запас"
              >
                  <ArrowDownCircleIcon className="h-4 w-4" />
                  В запас
              </Button>
            </div>
        ))}

        {renderPlayerTable('Неактивные игроки команды (в запасе)', categorizedPlayers.inactiveInTeam, (player) => (
            <div className="flex justify-end space-x-2">
                <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-green-600 border-green-400 hover:bg-green-50 hover:text-green-700"
                    onClick={() => handleActivateInTeam(player.id)}
                    disabled={!isCoachTeam}
                    title="Вернуть из запаса"
                >
                    <ArrowUpCircleIcon className="h-4 w-4" />
                    Вернуть
                </Button>
                <Button 
                    variant="danger"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleRemoveFromTeam(player.id)}
                    disabled={!isCoachTeam}
                    title="Полностью удалить из команды"
                >
                    <TrashIcon className="h-4 w-4" />
                    Удалить
                </Button>
            </div>
        ))}

        {renderPlayerTable('Свободные активные игроки', categorizedPlayers.freeActive, (player) => (
            <div className="flex justify-end">
              <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-blue-600 border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => handleAddToTeam(player.id)}
                  disabled={!isCoachTeam}
                  title="Добавить в команду"
              >
                  <UserPlusIcon className="h-4 w-4" />
                  Добавить
              </Button>
            </div>
        ))}
        
        {renderPlayerTable('Свободные неактивные игроки', categorizedPlayers.freeInactive, (player) => (
            <div className="flex justify-end space-x-2">
                <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-blue-600 border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => handleAddToTeam(player.id)}
                    disabled={!isCoachTeam}
                    title="Добавить в команду и активировать"
                >
                    <UserPlusIcon className="h-4 w-4" />
                    Активировать
                </Button>
            </div>
        ))}

        {renderPlayerTable('Игроки в других командах', categorizedPlayers.inOtherTeams, (player) => (
            <span className="text-sm text-gray-500">
                В команде: 
                <Link 
                    href={session?.user?.role?.toUpperCase() === 'ADMIN' ? `/admin/teams/${player.currentTeam?.id}` : `/coach/teams/${player.currentTeam?.id}`}
                    className="font-medium text-blue-600 hover:underline ml-1"
                >
                    {player.currentTeam?.name || 'Другая команда'}
                </Link>
            </span>
        ))}
        
      </div>
    </RoleProtectedLayout>
  );
} 