'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { 
  UserIcon, 
  CalendarIcon, 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon,
  EnvelopeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  IdentificationIcon,
  ScaleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { formatDateOnly } from '@/lib/utils';
import Link from 'next/link';
import { binaryToImageUrl } from '@/lib/utils/avatar';

interface ProfileViewProps {
  userData: any;
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

export default function ProfileView({ userData, isOwnProfile = false, onEdit }: ProfileViewProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Использование улучшенной функции преобразования
  useEffect(() => {
    if (userData?.profile?.avatar && userData.profile.avatarType) {
      try {
        console.log('Avatar data в ProfileView:', {
          avatarType: userData.profile.avatarType,
          avatarDataType: typeof userData.profile.avatar,
          isArray: Array.isArray(userData.profile.avatar),
          objectKeys: typeof userData.profile.avatar === 'object' ? Object.keys(userData.profile.avatar).slice(0, 5) : null,
          length: userData.profile.avatar.length
        });
        
        // Используем улучшенную функцию преобразования
        const url = binaryToImageUrl(userData.profile.avatar, userData.profile.avatarType);
        if (url) {
          setAvatarUrl(url);
          console.log('Созданный URL аватара:', url.substring(0, 50) + '...');
        } else {
          console.error('Не удалось создать URL для аватара');
        }
      } catch (error) {
        console.error('Ошибка при конвертации аватара:', error);
        console.error('Данные аватара:', userData.profile.avatar);
        console.error('Тип аватара:', userData.profile.avatarType);
      }
    }
  }, [userData?.profile?.avatar, userData?.profile?.avatarType]);
  
  if (!userData) return null;

  // Формирование заголовка в зависимости от роли
  let roleTitle = 'Пользователь';
  let roleBadgeColor = 'secondary';
  
  if (userData.role.name === 'ADMIN') {
    roleTitle = 'Администратор';
    roleBadgeColor = 'danger';
  } else if (userData.role.name === 'COACH') {
    roleTitle = 'Тренер';
    roleBadgeColor = 'success';
  } else if (userData.role.name === 'PLAYER') {
    roleTitle = 'Игрок';
    roleBadgeColor = 'default';
  }

  // Позиция игрока на русском языке
  const getPlayerPosition = (position: string) => {
    switch(position) {
      case 'POINT_GUARD': return 'Разыгрывающий защитник';
      case 'SHOOTING_GUARD': return 'Атакующий защитник';
      case 'SMALL_FORWARD': return 'Легкий форвард';
      case 'POWER_FORWARD': return 'Тяжелый форвард';
      case 'CENTER': return 'Центровой';
      default: return '-';
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      {/* Фон с градиентом */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl overflow-hidden shadow-sm mb-6">
        <div className="p-8 flex flex-col items-center relative">
          {/* Кнопка редактирования */}
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-6 right-6 rounded-full p-2 bg-white/70 hover:bg-white/90 shadow-sm"
              onClick={onEdit}
            >
              <PencilIcon className="h-5 w-5 text-gray-600" />
            </Button>
          )}
          
          {/* Аватар с кольцом статуса */}
          <div className="relative mb-4">
            <div className={`absolute inset-0 rounded-full -m-1 ${userData.isActive ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gradient-to-r from-red-400 to-pink-500'}`}></div>
            <div className="relative rounded-full p-1 bg-white">
              <Avatar 
                name={`${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`}
                size="lg"
                src={avatarUrl || null}
                className="h-32 w-32"
              />
            </div>
          </div>
          
          {/* Имя и статус */}
          <h2 className="text-2xl font-medium text-gray-800">
            {userData.profile?.firstName} {userData.profile?.lastName}
          </h2>
          
          <Badge 
            variant={roleBadgeColor as any} 
            className="mt-2 rounded-full px-3 py-1"
          >
            {roleTitle}
          </Badge>
          
          <div className="flex items-center justify-center mt-3 text-gray-500">
            <div className={`w-3 h-3 rounded-full mr-2 ${userData.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{userData.isActive ? 'Активен' : 'Неактивен'}</span>
          </div>
          
          {/* Контактная информация */}
          <div className="w-full mt-6 max-w-md">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-center border-b border-gray-100">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-600">{userData.email}</span>
              </div>
              
              {userData.profile?.phone && (
                <div className="p-4 flex items-center border-b border-gray-100">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">{userData.profile.phone}</span>
                </div>
              )}
              
              {userData.profile?.address && (
                <div className="p-4 flex items-center border-b border-gray-100">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">{userData.profile.address}</span>
                </div>
              )}
              
              <div className="p-4 flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-600">Регистрация: {formatDateOnly(userData.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Специфичные данные в зависимости от роли */}
      {userData.player && (
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden mb-6">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="flex items-center text-gray-700">
              <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
              Данные игрока
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <dl className="space-y-6">
              {userData.player.birthDate && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Дата рождения</dt>
                  <dd className="text-gray-800">
                    {formatDateOnly(userData.player.birthDate)}
                  </dd>
                </div>
              )}
              
              {userData.player.position && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Позиция</dt>
                  <dd className="text-gray-800 font-medium">
                    {getPlayerPosition(userData.player.position)}
                  </dd>
                </div>
              )}
              
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500 mb-1">Команда</dt>
                <dd className="text-gray-800 font-medium">
                  {userData.player.teamPlayers && userData.player.teamPlayers.length > 0 
                    ? userData.player.teamPlayers[0].team.name
                    : <span className="text-gray-500">Свободен</span>}
                </dd>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {userData.player.height && (
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 mb-1">Рост</dt>
                    <dd className="text-gray-800">{userData.player.height} см</dd>
                  </div>
                )}
                
                {userData.player.weight && (
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 mb-1">Вес</dt>
                    <dd className="text-gray-800">{userData.player.weight} кг</dd>
                  </div>
                )}
              </div>
              
              {userData.player.jerseyNumber && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Номер</dt>
                  <dd className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                      {userData.player.jerseyNumber}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
      
      {userData.coach && (
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden mb-6">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="flex items-center text-gray-700">
              <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
              Данные тренера
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <dl className="space-y-6">
              {userData.coach.specialization && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Специализация</dt>
                  <dd className="text-gray-800 whitespace-pre-line">
                    {userData.coach.specialization}
                  </dd>
                </div>
              )}
              
              {userData.coach.experience && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Опыт работы</dt>
                  <dd className="text-gray-800 font-medium">
                    {userData.coach.experience} {
                      String(userData.coach.experience).endsWith('1') && userData.coach.experience !== 11 ? 'год' :
                      (String(userData.coach.experience).endsWith('2') || 
                       String(userData.coach.experience).endsWith('3') || 
                       String(userData.coach.experience).endsWith('4')) && 
                      (userData.coach.experience < 10 || userData.coach.experience > 20) ? 'года' : 'лет'
                    }
                  </dd>
                </div>
              )}
              
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500 mb-1">Команда</dt>
                <dd className="text-gray-800 font-medium">
                  {userData.coach.teams && userData.coach.teams.length > 0 
                    ? userData.coach.teams[0].name
                    : <span className="text-gray-500">Свободен</span>}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 