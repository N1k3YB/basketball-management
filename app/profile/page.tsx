'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProfileView from '../../components/profile/ProfileView';
import ProfileEdit from '../../components/profile/ProfileEdit';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userId = session?.user?.id;
        
        if (!userId) {
          throw new Error('Пользователь не авторизован');
        }
        
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные пользователя');
        }
        
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        setError('Не удалось загрузить данные профиля');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);
  
  const handleSave = async (formData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }
      
      interface ApiData {
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        playerData?: {
          birthDate: string;
          height: number | null;
          weight: number | null;
          position: string;
          jerseyNumber: number | null;
        };
        coachData?: {
          specialization: string;
          experience: number | null;
        };
      }
      
      const apiData: ApiData = {
        firstName: formData.profile.firstName,
        lastName: formData.profile.lastName, 
        phone: formData.profile.phone,
        address: formData.profile.address,
      };
      
      if (formData.player) {
        apiData.playerData = {
          birthDate: formData.player.birthDate,
          height: formData.player.height ? parseFloat(formData.player.height) : null,
          weight: formData.player.weight ? parseFloat(formData.player.weight) : null,
          position: formData.player.position,
          jerseyNumber: formData.player.jerseyNumber ? parseInt(formData.player.jerseyNumber) : null
        };
      }
      
      if (formData.coach) {
        apiData.coachData = {
          specialization: formData.coach.specialization,
          experience: formData.coach.experience ? parseInt(formData.coach.experience) : null
        };
      }
      
      console.log('Отправляемые данные:', apiData);
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось сохранить изменения');
      }
      
      const updatedData = await response.json();
      setUserData(updatedData);
      setIsEditing(false);
      
      await update();
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      setError((error as Error).message || 'Не удалось сохранить изменения');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !userData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <BasketballSpinner label="Загрузка профиля..." />
      </div>
    );
  }
  
  if (error && !userData) {
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
  
  if (!session?.user) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-xl shadow-md backdrop-blur-sm">
          <h3 className="text-lg font-medium mb-2">Требуется авторизация</h3>
          <p>Для просмотра профиля необходимо войти в систему.</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/auth/login')}
            className="mt-4 flex items-center gap-2 rounded-xl"
          >
            Войти
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="w-10 h-10 flex items-center justify-center rounded-full p-0 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
      </Button>
      
      {isEditing ? (
        <ProfileEdit 
          userData={userData} 
          onSave={handleSave} 
          onCancel={() => setIsEditing(false)} 
        />
      ) : (
        <ProfileView 
          userData={userData} 
          isOwnProfile={true} 
          onEdit={() => setIsEditing(true)} 
        />
      )}
    </div>
  );
} 