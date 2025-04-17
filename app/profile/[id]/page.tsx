'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  CalendarIcon, 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ScaleIcon,
  TrophyIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Separator } from '@/components/ui/Separator';
import { formatDateOnly } from '@/lib/utils';
import { binaryToImageUrl } from '@/lib/utils/avatar';
import Link from 'next/link';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/${userId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные пользователя');
        }
        
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        setError('Не удалось загрузить данные профиля');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);
  
  useEffect(() => {
    if (userData?.profile?.avatar && userData.profile.avatarType) {
      try {
        console.log('Avatar data в PublicProfilePage:', {
          avatarType: userData.profile.avatarType,
          avatarDataType: typeof userData.profile.avatar,
          isArray: Array.isArray(userData.profile.avatar),
          objectKeys: typeof userData.profile.avatar === 'object' ? Object.keys(userData.profile.avatar).slice(0, 5) : null,
          length: userData.profile.avatar.length
        });
        
        const url = binaryToImageUrl(userData.profile.avatar, userData.profile.avatarType);
        if (url) {
          setAvatarUrl(url);
          console.log('Созданный URL аватара (публичный профиль):', url.substring(0, 50) + '...');
        } else {
          console.error('Не удалось создать URL для аватара в публичном профиле');
        }
      } catch (error) {
        console.error('Ошибка при конвертации аватара в публичном профиле:', error);
      }
    }
  }, [userData?.profile?.avatar, userData?.profile?.avatarType]);
  
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <BasketballSpinner label="Загрузка профиля..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-md backdrop-blur-sm">
          <h3 className="text-lg font-medium mb-2">Произошла ошибка</h3>
          <p>{error}</p>
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full p-0 mt-4"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-xl shadow-md backdrop-blur-sm">
          <h3 className="text-lg font-medium mb-2">Пользователь не найден</h3>
          <p>Запрашиваемый профиль пользователя не существует или был удален.</p>
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full p-0 mt-4"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
      </div>
    );
  }
  
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
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full p-0 mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
        </Button>
        <h1 className="text-2xl font-medium">Профиль пользователя</h1>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl overflow-hidden shadow-sm mb-6">
        <div className="p-8 flex flex-col items-center relative">
          <div className="relative mb-4">
            <div className={`absolute inset-0 rounded-full -m-1 ${userData.isActive ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gradient-to-r from-red-400 to-pink-500'}`}></div>
            <div className="relative rounded-full p-1 bg-white">
              <Avatar 
                name={`${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`}
                size="lg"
                src={avatarUrl}
                className="h-32 w-32"
              />
            </div>
          </div>
          
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
      
      {/* Вкладки с информацией */}
      <Tabs defaultValue={userData.player ? "player" : (userData.coach ? "coach" : "")} className="w-full">
        <TabsList className="w-full rounded-xl bg-gray-100/70 backdrop-blur-sm p-1">
          {userData.player && <TabsTrigger value="player" className="rounded-lg">Игрок</TabsTrigger>}
          {userData.coach && <TabsTrigger value="coach" className="rounded-lg">Тренер</TabsTrigger>}
        </TabsList>
        
        {userData.player && (
          <TabsContent value="player">
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50">
                <CardTitle className="flex items-center text-gray-700">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Данные игрока
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {userData.player.jerseyNumber && (
                    <div className="col-span-2 flex justify-center mb-4">
                      <div className="relative">
                        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                          <span className="text-3xl font-bold text-white">{userData.player.jerseyNumber}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {userData.player.birthDate && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Дата рождения</span>
                      </div>
                      <div className="text-gray-800 font-medium">
                        {formatDateOnly(userData.player.birthDate)}
                      </div>
                    </div>
                  )}
                  
                  {userData.player.position && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <IdentificationIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Позиция</span>
                      </div>
                      <div className="text-gray-800 font-medium">
                        {getPlayerPosition(userData.player.position)}
                      </div>
                    </div>
                  )}
                  
                  {userData.player.height && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <ScaleIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Рост</span>
                      </div>
                      <div className="text-gray-800 font-medium">
                        {userData.player.height} см
                      </div>
                    </div>
                  )}
                  
                  {userData.player.weight && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <ScaleIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Вес</span>
                      </div>
                      <div className="text-gray-800 font-medium">
                        {userData.player.weight} кг
                      </div>
                    </div>
                  )}
                  
                  {userData.player.teamPlayers && userData.player.teamPlayers.length > 0 && (
                    <div className="col-span-2 bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <UsersIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Команды</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userData.player.teamPlayers.map((teamPlayer: any) => (
                            <span className="inline-block px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm font-medium transition-colors">
                              {teamPlayer.team.name}
                            </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {userData.coach && (
          <TabsContent value="coach">
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50">
                <CardTitle className="flex items-center text-gray-700">
                  <IdentificationIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Данные тренера
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {userData.coach.specialization && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <TrophyIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Специализация</span>
                      </div>
                      <div className="text-gray-800 font-medium">
                        {userData.coach.specialization}
                      </div>
                    </div>
                  )}
                  
                  {userData.coach.experience && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <ClockIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Опыт работы</span>
                      </div>
                      <div className="text-gray-800 font-medium">
                        {userData.coach.experience} лет
                      </div>
                    </div>
                  )}
                  
                  {userData.coach.teams && userData.coach.teams.length > 0 && (
                    <div className="col-span-2 bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <UsersIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Команды</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userData.coach.teams.map((team: any) => (
                          <Link href={`/coach/teams/${team.id}`} key={team.id} passHref>
                            <span className="inline-block px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-full text-sm font-medium transition-colors">
                              {team.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 