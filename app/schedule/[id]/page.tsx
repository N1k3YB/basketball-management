'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, ClockIcon, MapPinIcon, CalendarIcon, UsersIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { formatDateTime, formatEventType, formatMatchStatus } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { formatPlayerPosition } from '@/lib/utils';
import React from 'react';
import { extractExternalTeamName } from "@/lib/utils";
import BasketballSpinner from '@/components/ui/BasketballSpinner';

interface Event {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  eventType: string;
  location: string | null;
  status: string;
  eventTeams: {
    team: {
      id: string;
      name: string;
      coach?: {
        id: string;
      };
    };
  }[];
  eventPlayers: {
    player: {
      id: string;
      position: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        profile: {
          firstName: string;
          lastName: string;
          avatar?: string;
        };
      };
    };
    attendance: string;
  }[];
  match?: {
    id: string;
    homeTeamId: string;
    homeTeam: {
      id: string;
      name: string;
    };
    awayTeam: {
      id: string;
      name: string;
    } | null;
    awayTeamName?: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    playerStats: {
      id: string;
      playerId: string;
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
      minutesPlayed: number;
      fieldGoalsMade: number;
      fieldGoalsAttempted: number;
      threePointersMade: number;
      threePointersAttempted: number;
      freeThrowsMade: number;
      freeThrowsAttempted: number;
    }[];
  } | null;
}

// Интерфейс для статистики игрока
interface PlayerStat {
  playerId: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  minutesPlayed: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
}

// Интерфейс для посещаемости
interface Attendance {
  playerId: string;
  status: string;
}

export default function EventViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = React.useState("info");
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${id}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные события');
        }
        
        const data = await response.json();
        setEvent(data);
        setError(null);
      } catch (error) {
        console.error('Ошибка загрузки события:', error);
        setError('Не удалось загрузить данные события. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);
  
  const getEventTypeStyle = (eventType: string) => {
    switch(eventType) {
      case 'TRAINING':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'MATCH':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'MEETING':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };
  
  const getMatchStatusStyle = (status: string) => {
    switch(status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getMatchContainerStyle = (match: Event['match']) => {
    if (!match) return '';
    
    if (match.status === 'CANCELLED') {
      return 'bg-red-50';
    }
    
    if (match.status === 'COMPLETED' && match.homeScore !== null && match.awayScore !== null) {
      if (match.homeScore > match.awayScore) {
        return 'bg-green-50';  // Победа домашней команды
      } else if (match.homeScore < match.awayScore) {
        return 'bg-red-50';    // Поражение домашней команды
      } else {
        return 'bg-yellow-50'; // Ничья
      }
    }
    
    return 'bg-gray-50'; // По умолчанию
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <BasketballSpinner label="Загрузка данных события..." />
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-5 rounded-2xl shadow-sm mb-6">
          <p className="text-center">{error || 'Событие не найдено'}</p>
        </div>
        <div className="flex justify-center mt-6">
          <Button 
            onClick={() => router.back()}
            variant="ghost"
            className="w-10 h-10 flex items-center justify-center rounded-full p-0 mt-6"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
      </div>
    );
  }
  
  // Получение даты и времени начала события
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  
  const formatIOSDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return {
      date: `${day}.${month}.${year}`,
      time: `${hours}:${minutes}`
    };
  };
  
  const startFormatted = formatIOSDate(startDate);
  const endFormatted = formatIOSDate(endDate);
  
  return (
    <div className="container mx-auto p-6 pb-24">
      {/* Верхняя навигационная панель */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="rounded-full w-10 h-10 flex items-center justify-center p-0"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
        </Button>
        
        <h1 className="text-xl font-semibold text-center flex-1">Детали события</h1>
        
        <div className="w-10 h-10"></div> {/* Пустой блок для выравнивания */}
      </div>
      
      {/* Заголовок события с типом */}
      <div className="mb-6">
        <div className={`${getEventTypeStyle(event.eventType)} text-white text-sm font-medium rounded-full px-4 py-1 inline-block mb-2 shadow-sm`}>
          {formatEventType(event.eventType)}
        </div>
        <h2 className="text-2xl font-bold">{event.title}</h2>
      </div>
      
      {/* Основные блоки с информацией */}
      <div className="space-y-6">
        {/* Блок времени */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-start mb-4">
            <div className="bg-blue-50 rounded-full p-2 mr-3">
              <ClockIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Дата и время</h3>
              <div className="text-sm text-gray-600 mt-1">
                <div className="flex items-center mt-1">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{startFormatted.date} - {startDate.getDate() !== endDate.getDate() ? endFormatted.date : ''}</span>
                </div>
                <div className="flex items-center mt-1">
                  <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{startFormatted.time} - {endFormatted.time}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Локация */}
          {event.location && (
            <div className="flex items-start mt-4 pt-4 border-t border-gray-100">
              <div className="bg-green-50 rounded-full p-2 mr-3">
                <MapPinIcon className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Место проведения</h3>
                <p className="text-sm text-gray-600 mt-1">{event.location}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Блок команд */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-start">
            <div className="bg-purple-50 rounded-full p-2 mr-3">
              <UsersIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Команда</h3>
              
              {event.eventTeams.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {event.eventTeams.map((et) => (
                    <div 
                      key={et.team.id} 
                      className="bg-gray-50 rounded-xl p-3 flex items-center"
                    >
                      <div className="bg-purple-100 text-purple-700 font-bold rounded-lg w-8 h-8 flex items-center justify-center mr-3">
                        {et.team.name.charAt(0)}
                      </div>
                      <span className="text-sm">{et.team.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 mt-1">Нет команд</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Блок матча, если это матч */}
        {event.match && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-start mb-4">
              <div className="bg-red-50 rounded-full p-2 mr-3">
                <InformationCircleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Информация о матче</h3>
              </div>
            </div>
            
            {/* Команды и счет */}
            <div className={`mt-4 ${getMatchContainerStyle(event.match)} rounded-xl p-4 transition-colors duration-300`}>
              <div className="flex justify-between items-center">
                {/* Домашняя команда */}
                <div className="text-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold mx-auto">
                    {event.match.homeTeam.name.charAt(0)}
                  </div>
                  <div className="mt-2 font-medium text-sm">{event.match.homeTeam.name}</div>
                </div>
                
                {/* Счет */}
                <div className="flex flex-col items-center mx-4">
                  {event.match.homeScore !== null && event.match.awayScore !== null ? (
                    <div className="flex items-center">
                      <div className="text-2xl font-bold">{event.match.homeScore}</div>
                      <div className="mx-2 text-gray-400">:</div>
                      <div className="text-2xl font-bold">{event.match.awayScore}</div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Матч не начался</div>
                  )}
                  
                  {/* Статус матча перемещен под счет */}
                  <div className="mt-2">
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${getMatchStatusStyle(event.match.status)}`}>
                      {formatMatchStatus(event.match.status)}
                    </span>
                  </div>
                </div>
                
                {/* Гостевая команда */}
                <div className="text-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-lg font-bold mx-auto">
                    {(event.match.awayTeam && event.match.awayTeam.id !== event.match.homeTeam.id 
                      ? event.match.awayTeam.name 
                      : (extractExternalTeamName(event.description) || 'Г')).charAt(0)}
                  </div>
                  <div className="mt-2 font-medium text-sm">
                    {event.match.awayTeam && event.match.awayTeam.id !== event.match.homeTeam.id
                      ? event.match.awayTeam.name 
                      : (extractExternalTeamName(event.description) || 'Гостевая команда')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Описание события, если есть */}
        {event.description && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-start">
              <div className="bg-yellow-50 rounded-full p-2 mr-3">
                <InformationCircleIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Описание</h3>
                <p className="text-sm text-gray-600 mt-2">{event.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 