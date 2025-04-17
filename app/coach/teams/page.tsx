'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { Search, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { EyeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@/components/ui/Pagination';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface Team {
  id: string;
  name: string;
  category: string;
  playersCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  isActive: boolean;
}

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'name',
    direction: 'ascending',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/coach/teams');
        if (!response.ok) {
          throw new Error('Не удалось загрузить список команд');
        }
        const data = await response.json();
        setTeams(data);
        setFilteredTeams(data);
      } catch (error) {
        setError('Не удалось загрузить список команд');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.category && team.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const sortedFiltered = [...filtered].sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'ascending'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortConfig.key === 'playersCount') {
        const countA = a.playersCount || 0;
        const countB = b.playersCount || 0;
        return sortConfig.direction === 'ascending'
          ? countA - countB
          : countB - countA;
      } else if (sortConfig.key === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    setFilteredTeams(sortedFiltered);
  }, [searchTerm, teams, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const SortIcon = ({ dataKey }: { dataKey: string }) => {
    if (sortConfig.key !== dataKey) {
      return <ChevronDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const formatTeamStatus = (team: Team) => {
    if (team.status === 'inactive' || team.isActive === false) return 'Неактивна';
    return 'Активна';
  };

  const formatTeamType = (team: Team) => {
    if (!team.category) return 'Основная';
    return team.category;
  };

  return (
    <RoleProtectedLayout allowedRoles={['COACH']}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Мои команды</h1>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Поиск по названию или категории"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8"
            />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
              Попробовать снова
            </Button>
          </div>
        )}
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка команд..." />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              {searchTerm
                ? 'Не найдено команд, соответствующих поисковому запросу'
                : 'У вас пока нет команд'}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-4">
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
                    <button onClick={() => handleSort('name')} className="flex items-center text-sm font-medium">
                      Название
                      <SortIcon dataKey="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('playersCount')} className="flex items-center text-sm font-medium">
                      Игроки
                      <SortIcon dataKey="playersCount" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('createdAt')} className="flex items-center text-sm font-medium">
                      Дата создания
                      <SortIcon dataKey="createdAt" />
                    </button>
                  </TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeams.map((team) => (
                  <TableRow key={team.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/coach/teams/${team.id}`)}>
                    <TableCell className="font-medium">
                      <div>{team.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1.5 text-gray-500" />
                        <span>{team.playersCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {team.createdAt ? new Date(team.createdAt).toLocaleDateString('ru-RU') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="badge badge-role">
                        {formatTeamType(team)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`status-badge ${formatTeamStatus(team) === 'Активна' ? 'status-active' : 'status-inactive'}`}>{formatTeamStatus(team)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!loading && filteredTeams.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
        {/* Информация о количестве найденных команд */}
        {!loading && filteredTeams.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Найдено команд: {filteredTeams.length}
          </div>
        )}
      </div>
    </RoleProtectedLayout>
  );
} 