'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';

export default function CreateUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  
  // Хранение ошибок валидации полей
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Основные данные пользователя
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    roleId: ''
  });
  
  // Данные для роли игрока
  const [playerData, setPlayerData] = useState({
    birthDate: '',
    height: '',
    weight: '',
    position: 'POINT_GUARD',
    jerseyNumber: ''
  });
  
  // Данные для роли тренера
  const [coachData, setCoachData] = useState({
    specialization: '',
    experience: ''
  });
  
  // Загрузка доступных ролей
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles');
        if (response.ok) {
          const data = await response.json();
          setRoles(data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке ролей:', error);
      }
    };
    
    fetchRoles();
  }, []);
  
  // Валидация email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Валидация пароля (минимум 6 символов)
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };
  
  // Валидация телефона (опционально)
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Телефон не обязателен
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };
  
  // Валидация числовых полей
  const validateNumber = (value: string): boolean => {
    if (!value) return true; // Числовые поля могут быть пустыми
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  };
  
  // Валидация всех полей формы
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Валидация основных полей
    if (!userData.email) {
      errors.email = 'Email обязателен';
    } else if (!validateEmail(userData.email)) {
      errors.email = 'Некорректный формат email';
    }
    
    if (!userData.password) {
      errors.password = 'Пароль обязателен';
    } else if (!validatePassword(userData.password)) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    }
    
    if (!userData.firstName) {
      errors.firstName = 'Имя обязательно';
    }
    
    if (!userData.lastName) {
      errors.lastName = 'Фамилия обязательна';
    }
    
    if (userData.phone && !validatePhone(userData.phone)) {
      errors.phone = 'Некорректный формат телефона';
    }
    
    if (!userData.roleId) {
      errors.roleId = 'Роль обязательна';
    }
    
    // Валидация полей игрока
    if (selectedRole === 'PLAYER') {
      if (!playerData.birthDate) {
        errors.birthDate = 'Дата рождения обязательна';
      }
      
      if (playerData.height && !validateNumber(playerData.height)) {
        errors.height = 'Рост должен быть положительным числом';
      }
      
      if (playerData.weight && !validateNumber(playerData.weight)) {
        errors.weight = 'Вес должен быть положительным числом';
      }
      
      if (playerData.jerseyNumber && !validateNumber(playerData.jerseyNumber)) {
        errors.jerseyNumber = 'Номер должен быть положительным числом';
      }
    }
    
    // Валидация полей тренера
    if (selectedRole === 'COACH') {
      if (coachData.experience && !validateNumber(coachData.experience)) {
        errors.experience = 'Опыт должен быть положительным числом';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка формы перед отправкой
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Формирование данных для отправки
      const dataToSend: any = {
        ...userData
      };
      
      // Добавление данных в зависимости от выбранной роли
      if (selectedRole === 'PLAYER') {
        dataToSend.playerData = {
          ...playerData,
          height: playerData.height ? parseFloat(playerData.height) : null,
          weight: playerData.weight ? parseFloat(playerData.weight) : null,
          jerseyNumber: playerData.jerseyNumber ? parseInt(playerData.jerseyNumber) : null
        };
      } else if (selectedRole === 'COACH') {
        dataToSend.coachData = {
          ...coachData,
          experience: coachData.experience ? parseInt(coachData.experience) : null
        };
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось создать пользователя');
      }
      
      // Перенаправление на страницу пользователей
      router.push('/admin/users');
      router.refresh();
      
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      setError(error instanceof Error ? error.message : 'Не удалось создать пользователя');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработка изменения роли
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value;
    setUserData({ ...userData, roleId });
    
    // Сброс ошибки валидации роли при изменении
    setValidationErrors(prev => ({...prev, roleId: ''}));
    
    const selectedRoleObj = roles.find(role => role.id === roleId);
    if (selectedRoleObj) {
      setSelectedRole(selectedRoleObj.name);
    }
  };
  
  // Обработка изменения полей основных данных пользователя
  const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
    
    // Сброс ошибки валидации для поля при изменении
    setValidationErrors(prev => ({...prev, [name]: ''}));
  };
  
  // Обработка изменения полей данных игрока
  const handlePlayerDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlayerData({ ...playerData, [name]: value });
    
    // Сброс ошибки валидации для поля при изменении
    setValidationErrors(prev => ({...prev, [name]: ''}));
  };
  
  // Обработка изменения полей данных тренера
  const handleCoachDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCoachData({ ...coachData, [name]: value });
    
    // Сброс ошибки валидации для поля при изменении
    setValidationErrors(prev => ({...prev, [name]: ''}));
  };
  
  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Создание нового пользователя</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
          >
            Назад к списку
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleUserDataChange}
                  required
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Пароль *</label>
                <Input
                  type="password"
                  name="password"
                  value={userData.password}
                  onChange={handleUserDataChange}
                  required
                  className={validationErrors.password ? "border-red-500" : ""}
                />
                {validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Имя *</label>
                <Input
                  type="text"
                  name="firstName"
                  value={userData.firstName}
                  onChange={handleUserDataChange}
                  required
                  className={validationErrors.firstName ? "border-red-500" : ""}
                />
                {validationErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Фамилия *</label>
                <Input
                  type="text"
                  name="lastName"
                  value={userData.lastName}
                  onChange={handleUserDataChange}
                  required
                  className={validationErrors.lastName ? "border-red-500" : ""}
                />
                {validationErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <Input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleUserDataChange}
                  className={validationErrors.phone ? "border-red-500" : ""}
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Адрес</label>
                <Input
                  type="text"
                  name="address"
                  value={userData.address}
                  onChange={handleUserDataChange}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Роль *</label>
                <select
                  className={`w-full p-2 border ${validationErrors.roleId ? "border-red-500" : "border-gray-300"} rounded-md`}
                  value={userData.roleId}
                  onChange={handleRoleChange}
                  required
                >
                  <option value="">Выберите роль</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name === 'ADMIN' ? 'Администратор' : 
                       role.name === 'COACH' ? 'Тренер' : 
                       role.name === 'PLAYER' ? 'Игрок' : role.name}
                    </option>
                  ))}
                </select>
                {validationErrors.roleId && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.roleId}</p>
                )}
              </div>
            </div>
            
            <div>
              {selectedRole === 'PLAYER' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Информация об игроке</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Дата рождения *</label>
                    <Input
                      type="date"
                      name="birthDate"
                      value={playerData.birthDate}
                      onChange={handlePlayerDataChange}
                      required
                      className={validationErrors.birthDate ? "border-red-500" : ""}
                    />
                    {validationErrors.birthDate && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.birthDate}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Рост (см)</label>
                    <Input
                      type="number"
                      name="height"
                      value={playerData.height}
                      onChange={handlePlayerDataChange}
                      className={validationErrors.height ? "border-red-500" : ""}
                      min="0"
                      step="0.01"
                    />
                    {validationErrors.height && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.height}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Вес (кг)</label>
                    <Input
                      type="number"
                      name="weight"
                      value={playerData.weight}
                      onChange={handlePlayerDataChange}
                      className={validationErrors.weight ? "border-red-500" : ""}
                      min="0"
                      step="0.01"
                    />
                    {validationErrors.weight && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.weight}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Позиция *</label>
                    <select
                      className={`w-full p-2 border border-gray-300 rounded-md`}
                      name="position"
                      value={playerData.position}
                      onChange={handlePlayerDataChange}
                      required
                    >
                      <option value="POINT_GUARD">Разыгрывающий защитник</option>
                      <option value="SHOOTING_GUARD">Атакующий защитник</option>
                      <option value="SMALL_FORWARD">Легкий форвард</option>
                      <option value="POWER_FORWARD">Тяжелый форвард</option>
                      <option value="CENTER">Центровой</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Номер</label>
                    <Input
                      type="number"
                      name="jerseyNumber"
                      value={playerData.jerseyNumber}
                      onChange={handlePlayerDataChange}
                      className={validationErrors.jerseyNumber ? "border-red-500" : ""}
                      min="0"
                      step="1"
                    />
                    {validationErrors.jerseyNumber && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.jerseyNumber}</p>
                    )}
                  </div>
                </div>
              )}
              
              {selectedRole === 'COACH' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Информация о тренере</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Специализация</label>
                    <Input
                      type="text"
                      name="specialization"
                      value={coachData.specialization}
                      onChange={handleCoachDataChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Опыт (лет)</label>
                    <Input
                      type="number"
                      name="experience"
                      value={coachData.experience}
                      onChange={handleCoachDataChange}
                      className={validationErrors.experience ? "border-red-500" : ""}
                      min="0"
                      step="1"
                    />
                    {validationErrors.experience && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.experience}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => router.push('/admin/users')}
            >
              Отменить
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Создание...' : 'Создать пользователя'}
            </Button>
          </div>
        </form>
      </div>
    </RoleProtectedLayout>
  );
} 