'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  UserIcon, 
  CalendarIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ScaleIcon,
  TrophyIcon,
  ArrowLeftIcon,
  CheckIcon,
  CameraIcon,
  PhotoIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { formatDateOnly } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { binaryToImageUrl } from '@/lib/utils/avatar';
import { toast } from 'react-hot-toast';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface ProfileEditProps {
  userData: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileEdit({ userData, onSave, onCancel }: ProfileEditProps) {
  const [formData, setFormData] = useState({
    profile: {
      firstName: userData.profile?.firstName || '',
      lastName: userData.profile?.lastName || '',
      phone: userData.profile?.phone || '',
      address: userData.profile?.address || '',
    },
    player: userData.player ? {
      birthDate: userData.player.birthDate ? formatDateOnly(userData.player.birthDate) : '',
      height: userData.player.height || '',
      weight: userData.player.weight || '',
      position: userData.player.position || '',
      jerseyNumber: userData.player.jerseyNumber || '',
    } : null,
    coach: userData.coach ? {
      specialization: userData.coach.specialization || '',
      experience: userData.coach.experience || '',
    } : null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Конвертация бинарных данных аватара в URL при загрузке компонента
  useEffect(() => {
    if (userData?.profile?.avatar && userData.profile.avatarType && !avatarPreview) {
      try {
        console.log('Avatar data в ProfileEdit:', {
          avatarType: userData.profile.avatarType,
          avatarDataType: typeof userData.profile.avatar,
          isArray: Array.isArray(userData.profile.avatar),
          objectKeys: typeof userData.profile.avatar === 'object' ? Object.keys(userData.profile.avatar).slice(0, 5) : null,
          length: userData.profile.avatar.length
        });
        
        // Использование улучшенной функции преобразования
        const url = binaryToImageUrl(userData.profile.avatar, userData.profile.avatarType);
        if (url) {
          setAvatarPreview(url);
          console.log('Созданный URL превью аватара:', url.substring(0, 50) + '...');
        } else {
          console.error('Не удалось создать URL для аватара');
        }
      } catch (error) {
        console.error('Ошибка при конвертации аватара:', error);
        console.error('Данные аватара:', userData.profile.avatar);
        console.error('Тип аватара:', userData.profile.avatarType);
      }
    }
  }, [userData?.profile?.avatar, userData?.profile?.avatarType, avatarPreview]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Разбор имени поля на части (например, "profile.firstName")
    const parts = name.split('.');
    
    if (parts.length === 1) {
      // Простое поле
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (parts.length === 2) {
      // Вложенное поле (например, profile.firstName)
      const [section, field] = parts;
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: value
        }
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      setError('Не удалось сохранить изменения');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик загрузки аватарки
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Файл должен быть изображением');
      return;
    }
    
    // Проверка размера файла (5 МБ максимум)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Размер изображения не должен превышать 5 МБ');
      return;
    }
    
    // Создание превью 
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
        console.log('Превью из FileReader:', typeof event.target.result);
      }
    };
    reader.readAsDataURL(file);
    
    // Загрузка на сервер
    try {
      setAvatarLoading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Не удалось загрузить аватар');
      }
      
      toast.success('Аватар успешно загружен');
    } catch (error) {
      console.error('Ошибка при загрузке аватара:', error);
      toast.error((error as Error).message || 'Не удалось загрузить аватар');
      
      // Если произошла ошибка, сброс превью
      if (userData?.profile?.avatar) {
        try {
          // Восстановление оригинального изображения с использованием улучшенной функции
          const url = binaryToImageUrl(userData.profile.avatar, userData.profile.avatarType);
          if (url) {
            setAvatarPreview(url);
          } else {
            setAvatarPreview(null);
          }
        } catch (e) {
          console.error('Ошибка при восстановлении аватара:', e);
          setAvatarPreview(null);
        }
      } else {
        setAvatarPreview(null);
      }
    } finally {
      setAvatarLoading(false);
    }
  };
  
  // Обработчик удаления аватарки
  const handleDeleteAvatar = async () => {
    if (!userData.profile?.avatar) return;
    
    if (!confirm('Вы уверены, что хотите удалить аватар?')) {
      return;
    }
    
    try {
      setAvatarLoading(true);
      
      const response = await fetch('/api/users/avatar', {
        method: 'DELETE',
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Не удалось удалить аватар');
      }
      
      setAvatarPreview(null);
      toast.success('Аватар успешно удален');
    } catch (error) {
      console.error('Ошибка при удалении аватара:', error);
      toast.error((error as Error).message || 'Не удалось удалить аватар');
    } finally {
      setAvatarLoading(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      {isLoading ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <BasketballSpinner label="Сохранение изменений..." />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Основная информация */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden mb-6">
            <CardHeader className="bg-white border-b border-gray-50">
              <CardTitle className="flex items-center text-gray-700">
                <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Аватар */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Avatar 
                    name={`${formData.profile.firstName} ${formData.profile.lastName}`}
                    size="lg"
                    src={avatarPreview}
                    className="h-32 w-32"
                  />
                  <div className="absolute -bottom-2 right-0 flex space-x-2">
                    <label 
                      htmlFor="avatar-upload" 
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md"
                    >
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={avatarLoading}
                      />
                      {avatarLoading ? (
                        <CameraIcon className="h-5 w-5 opacity-50" />
                      ) : (
                        <CameraIcon className="h-5 w-5" />
                      )}
                    </label>
                    
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        disabled={avatarLoading}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full cursor-pointer shadow-md"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {avatarLoading && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center">
                  <BasketballSpinner label="Загрузка аватара..." />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label htmlFor="profile.firstName" className="text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  <Input
                    id="profile.firstName"
                    name="profile.firstName"
                    value={formData.profile.firstName}
                    onChange={handleChange}
                    placeholder="Введите имя"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label htmlFor="profile.lastName" className="text-sm font-medium text-gray-700 mb-1">
                    Фамилия
                  </label>
                  <Input
                    id="profile.lastName"
                    name="profile.lastName"
                    value={formData.profile.lastName}
                    onChange={handleChange}
                    placeholder="Введите фамилию"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label htmlFor="profile.phone" className="text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <Input
                    id="profile.phone"
                    name="profile.phone"
                    value={formData.profile.phone}
                    onChange={handleChange}
                    placeholder="Введите номер телефона"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label htmlFor="profile.address" className="text-sm font-medium text-gray-700 mb-1">
                    Адрес
                  </label>
                  <Input
                    id="profile.address"
                    name="profile.address"
                    value={formData.profile.address}
                    onChange={handleChange}
                    placeholder="Введите адрес"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Данные игрока */}
          {formData.player && (
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden mb-6">
              <CardHeader className="bg-white border-b border-gray-50">
                <CardTitle className="flex items-center text-gray-700">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Данные игрока
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="player.birthDate" className="text-sm font-medium text-gray-700 mb-1">
                      Дата рождения
                    </label>
                    <Input
                      id="player.birthDate"
                      name="player.birthDate"
                      type="date"
                      value={formData.player.birthDate}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label htmlFor="player.position" className="text-sm font-medium text-gray-700 mb-1">
                      Позиция
                    </label>
                    <select
                      id="player.position"
                      name="player.position"
                      value={formData.player.position}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Выберите позицию</option>
                      <option value="POINT_GUARD">Разыгрывающий защитник</option>
                      <option value="SHOOTING_GUARD">Атакующий защитник</option>
                      <option value="SMALL_FORWARD">Легкий форвард</option>
                      <option value="POWER_FORWARD">Тяжелый форвард</option>
                      <option value="CENTER">Центровой</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col">
                    <label htmlFor="player.height" className="text-sm font-medium text-gray-700 mb-1">
                      Рост (см)
                    </label>
                    <Input
                      id="player.height"
                      name="player.height"
                      type="number"
                      value={formData.player.height}
                      onChange={handleChange}
                      placeholder="Введите рост"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label htmlFor="player.weight" className="text-sm font-medium text-gray-700 mb-1">
                      Вес (кг)
                    </label>
                    <Input
                      id="player.weight"
                      name="player.weight"
                      type="number"
                      value={formData.player.weight}
                      onChange={handleChange}
                      placeholder="Введите вес"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label htmlFor="player.jerseyNumber" className="text-sm font-medium text-gray-700 mb-1">
                      Номер
                    </label>
                    <Input
                      id="player.jerseyNumber"
                      name="player.jerseyNumber"
                      type="number"
                      value={formData.player.jerseyNumber}
                      onChange={handleChange}
                      placeholder="Введите номер"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Данные тренера */}
          {formData.coach && (
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden mb-6">
              <CardHeader className="bg-white border-b border-gray-50">
                <CardTitle className="flex items-center text-gray-700">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Данные тренера
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="coach.specialization" className="text-sm font-medium text-gray-700 mb-1">
                      Специализация
                    </label>
                    <Textarea
                      id="coach.specialization"
                      name="coach.specialization"
                      value={formData.coach.specialization}
                      onChange={handleChange}
                      placeholder="Введите специализацию"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label htmlFor="coach.experience" className="text-sm font-medium text-gray-700 mb-1">
                      Опыт работы (лет)
                    </label>
                    <Input
                      id="coach.experience"
                      name="coach.experience"
                      type="number"
                      value={formData.coach.experience}
                      onChange={handleChange}
                      placeholder="Введите опыт работы"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Кнопки действий */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Отмена
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              Сохранить
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}
        </form>
      )}
    </div>
  );
} 