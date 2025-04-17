'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  
  // Состояние для хранения ошибок валидации полей
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Данные пользователя
  const [userData, setUserData] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    isActive: true,
    roleId: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    // Для игрока
    birthDate: '',
    height: '',
    weight: '',
    position: '',
    jerseyNumber: '',
    // Для тренера
    specialization: '',
    experience: ''
  });
  
  // Загрузка ролей для выпадающего списка
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles');
        if (!response.ok) {
          throw new Error('Не удалось загрузить роли');
        }
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Ошибка загрузки ролей:', error);
      }
    };
    
    fetchRoles();
  }, []);
  
  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные пользователя');
        }
        
        const data = await response.json();
        setUserData(data);
        
        // Заполняем форму данными пользователя
        setUserForm({
          email: data.email || '',
          isActive: data.isActive,
          roleId: data.roleId || '',
          firstName: data.profile?.firstName || '',
          lastName: data.profile?.lastName || '',
          phone: data.profile?.phone || '',
          address: data.profile?.address || '',
          birthDate: data.player?.birthDate ? new Date(data.player.birthDate).toISOString().split('T')[0] : '',
          height: data.player?.height?.toString() || '',
          weight: data.player?.weight?.toString() || '',
          position: data.player?.position || '',
          jerseyNumber: data.player?.jerseyNumber?.toString() || '',
          specialization: data.coach?.specialization || '',
          experience: data.coach?.experience?.toString() || ''
        });
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
        setError('Не удалось загрузить данные пользователя. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);
  
  // Функция валидации email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Функция валидации телефона
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Телефон не обязателен
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };
  
  // Функция валидации числовых полей
  const validateNumber = (value: string): boolean => {
    if (!value) return true; // Числовые поля могут быть пустыми
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  };
  
  // Валидация всех полей формы
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Валидация основных полей
    if (!userForm.email) {
      errors.email = 'Email обязателен';
    } else if (!validateEmail(userForm.email)) {
      errors.email = 'Некорректный формат email';
    }
    
    if (!userForm.firstName) {
      errors.firstName = 'Имя обязательно';
    }
    
    if (!userForm.lastName) {
      errors.lastName = 'Фамилия обязательна';
    }
    
    if (userForm.phone && !validatePhone(userForm.phone)) {
      errors.phone = 'Некорректный формат телефона';
    }
    
    if (!userForm.roleId) {
      errors.roleId = 'Роль обязательна';
    }
    
    // Валидация полей игрока
    if (userData?.player) {
      if (!userForm.birthDate) {
        errors.birthDate = 'Дата рождения обязательна';
      }
      
      if (userForm.height && !validateNumber(userForm.height)) {
        errors.height = 'Рост должен быть положительным числом';
      }
      
      if (userForm.weight && !validateNumber(userForm.weight)) {
        errors.weight = 'Вес должен быть положительным числом';
      }
      
      if (userForm.jerseyNumber && !validateNumber(userForm.jerseyNumber)) {
        errors.jerseyNumber = 'Номер должен быть положительным числом';
      }
    }
    
    // Валидация полей тренера
    if (userData?.coach) {
      if (userForm.experience && !validateNumber(userForm.experience)) {
        errors.experience = 'Опыт должен быть положительным числом';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Обработка чекбоксов
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setUserForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setUserForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Сбрасываем ошибку валидации для поля при изменении
    setValidationErrors(prev => ({...prev, [name]: ''}));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем форму перед отправкой
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Формирование данных для отправки
      const updateData: any = {
        email: userForm.email,
        isActive: userForm.isActive,
        roleId: userForm.roleId,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        phone: userForm.phone,
        address: userForm.address
      };
      
      // Добавление данных игрока, если роль PLAYER
      if (userData?.player) {
        updateData.playerData = {
          birthDate: userForm.birthDate,
          height: userForm.height ? parseFloat(userForm.height) : null,
          weight: userForm.weight ? parseFloat(userForm.weight) : null,
          position: userForm.position,
          jerseyNumber: userForm.jerseyNumber ? parseInt(userForm.jerseyNumber) : null
        };
      }
      
      // Добавление данных тренера, если роль COACH
      if (userData?.coach) {
        updateData.coachData = {
          specialization: userForm.specialization,
          experience: userForm.experience ? parseInt(userForm.experience) : null
        };
      }
      
      // Отправка запроса на обновление пользователя
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить пользователя');
      }
      
      setSuccess('Пользователь успешно обновлен');
      
      // Обновление данных пользователя
      const updatedUser = await response.json();
      setUserData(updatedUser);
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
      setError(error instanceof Error ? error.message : 'Не удалось обновить пользователя');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <BasketballSpinner label="Загрузка пользователя..." />
      </div>
    );
  }
  
  if (error && !userData) {
    return (
      <RoleProtectedLayout allowedRoles={['ADMIN']}>
        <div className="container mx-auto py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/users')}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Назад к списку пользователей
            </Button>
          </div>
        </div>
      </RoleProtectedLayout>
    );
  }
  
  return (
    <RoleProtectedLayout allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Редактирование пользователя</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Назад к списку
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Данные пользователя</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <Input
                      type="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleChange}
                      required
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Имя *</label>
                    <Input
                      type="text"
                      name="firstName"
                      value={userForm.firstName}
                      onChange={handleChange}
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
                      value={userForm.lastName}
                      onChange={handleChange}
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
                      value={userForm.phone}
                      onChange={handleChange}
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
                      value={userForm.address}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Роль *</label>
                    <select
                      name="roleId"
                      value={userForm.roleId}
                      onChange={handleChange}
                      required
                      className={`w-full p-2 border ${validationErrors.roleId ? "border-red-500" : "border-gray-300"} rounded-md`}
                    >
                      <option value="">Выберите роль</option>
                      {roles.map((role) => (
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
                  
                  <div className="mb-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={userForm.isActive}
                        onChange={handleChange}
                        className="form-checkbox h-5 w-5 text-primary-600"
                      />
                      <span className="text-sm font-medium">Активен</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  {userData?.player && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Информация об игроке</h2>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Дата рождения *</label>
                        <Input
                          type="date"
                          name="birthDate"
                          value={userForm.birthDate}
                          onChange={handleChange}
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
                          value={userForm.height}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          className={validationErrors.height ? "border-red-500" : ""}
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
                          value={userForm.weight}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          className={validationErrors.weight ? "border-red-500" : ""}
                        />
                        {validationErrors.weight && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.weight}</p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Позиция</label>
                        <select
                          name="position"
                          value={userForm.position}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
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
                          value={userForm.jerseyNumber}
                          onChange={handleChange}
                          min="0"
                          step="1"
                          className={validationErrors.jerseyNumber ? "border-red-500" : ""}
                        />
                        {validationErrors.jerseyNumber && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.jerseyNumber}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {userData?.coach && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Информация о тренере</h2>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Специализация</label>
                        <Input
                          type="text"
                          name="specialization"
                          value={userForm.specialization}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Опыт (лет)</label>
                        <Input
                          type="number"
                          name="experience"
                          value={userForm.experience}
                          onChange={handleChange}
                          min="0"
                          step="1"
                          className={validationErrors.experience ? "border-red-500" : ""}
                        />
                        {validationErrors.experience && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.experience}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push('/admin/users')}
                  className="mr-2"
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleProtectedLayout>
  );
}