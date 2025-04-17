'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@/components/ui/Pagination';
import { updateURLParams, useUrlParams } from '@/lib/urlParams';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface User {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    avatar?: string;
  } | null;
  player?: Record<string, any> | null;
  coach?: Record<string, any> | null;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const urlParams = useUrlParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(urlParams.getParam('search', ''));
  const [roleFilter, setRoleFilter] = useState(urlParams.getParam('role', ''));
  const [statusFilter, setStatusFilter] = useState(urlParams.getParam('status', ''));
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(urlParams.getNumParam('page', 1));
  const itemsPerPage = 15;
  const [sortField, setSortField] = useState(urlParams.getParam('sortField', 'email'));
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(urlParams.getParam('sortDir', 'asc') as 'asc' | 'desc');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        setError('Не удалось загрузить список пользователей. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Сохранение состояния в URL
    updateURLParams(router, {
      search: searchTerm || null,
      role: roleFilter || null,
      status: statusFilter || null,
      page: currentPage !== 1 ? currentPage : null,
      sortField: sortField !== 'email' ? sortField : null,
      sortDir: sortDirection !== 'asc' ? sortDirection : null,
    });
  }, [searchTerm, roleFilter, statusFilter, currentPage, sortField, sortDirection, router]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Обновление состояния после удаления
        setUsers(users.filter(user => user.id !== id));
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        alert('Не удалось удалить пользователя. Пожалуйста, попробуйте позже.');
      }
    }
  };

  const toggleUserStatus = async (id: string, isActive: boolean) => {
    try {
      // Необходимость HTTP-запроса к API в реальном проекте
      // Для примера только обновление состояния
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === id ? { ...user, isActive: !isActive } : user
        )
      );
    } catch (error) {
      console.error('Ошибка изменения статуса пользователя:', error);
    }
  };

  // Функция сортировки пользователей
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // Сброс страницы на первую при изменении сортировки
    setCurrentPage(1);
  };

  // Функция для получения иконки сортировки
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Функция фильтрации пользователей
  const filteredUsers = users.filter(user => {
    const nameMatch = user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter === '' || user.role.name === roleFilter;
    const statusMatch = statusFilter === '' || 
                      (statusFilter === 'active' && user.isActive) || 
                      (statusFilter === 'inactive' && !user.isActive);
    
    return (nameMatch || emailMatch) && roleMatch && statusMatch;
  });

  // Сортировка пользователей
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    // Определяем значения для сортировки в зависимости от выбранного поля
    switch (sortField) {
      case 'name':
        valueA = `${a.profile?.firstName || ''} ${a.profile?.lastName || ''}`;
        valueB = `${b.profile?.firstName || ''} ${b.profile?.lastName || ''}`;
        break;
      case 'email':
        valueA = a.email;
        valueB = b.email;
        break;
      case 'role':
        valueA = a.role.name;
        valueB = b.role.name;
        break;
      case 'status':
        valueA = a.isActive;
        valueB = b.isActive;
        break;
      default:
        valueA = a.email;
        valueB = b.email;
    }

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  // Пагинация
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Прокрутка к верху страницы при переключении
    window.scrollTo(0, 0);
  };

  // Функция для форматирования имени пользователя
  const formatUserName = (user: User) => {
    if (user.profile?.firstName || user.profile?.lastName) {
      return `${user.profile.firstName || ''} ${user.profile.lastName || ''}`;
    }
    return 'Нет данных';
  };

  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Состав</h1>
          <Button 
            onClick={() => router.push('/admin/users/create')}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Добавить
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Поиск по имени или email"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Сброс на первую страницу при поиске
              }}
            />
          </div>
          <div>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1); // Сброс на первую страницу при фильтрации
              }}
            >
              <option value="">Все роли</option>
              <option value="ADMIN">Администратор</option>
              <option value="COACH">Тренер</option>
              <option value="PLAYER">Игрок</option>
            </select>
          </div>
          <div>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Сброс на первую страницу при фильтрации
              }}
            >
              <option value="">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка пользователей..." />
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
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                    Имя {getSortIcon('name')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('email')} className="cursor-pointer">
                    Email {getSortIcon('email')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('role')} className="cursor-pointer">
                    Роль {getSortIcon('role')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                    Статус {getSortIcon('status')}
                  </TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className="hover:bg-gray-50 cursor-pointer" 
                      onClick={() => router.push(`/profile/${user.id}`)}
                    >
                      <TableCell className="font-medium">
                        {formatUserName(user)}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="badge badge-role">
                          {user.role.name === 'ADMIN' ? 'Администратор' :
                           user.role.name === 'COACH' ? 'Тренер' : 
                           user.role.name === 'PLAYER' ? 'Игрок' : user.role.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                          {user.isActive ? 'Активен' : 'Неактивен'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/users/${user.id}/edit`);
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
                              handleDelete(user.id);
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
                    <TableCell colSpan={5} className="text-center py-4">
                      Нет пользователей, соответствующих критериям поиска
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Компонент пагинации */}
        {!loading && !error && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
        
        {/* Информация о количестве найденных пользователей */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Найдено пользователей: {filteredUsers.length}
          </div>
        )}
      </div>
    </RoleProtectedLayout>
  );
} 