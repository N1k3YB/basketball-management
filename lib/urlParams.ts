import { useRouter, useSearchParams } from 'next/navigation';

// Функция для обновления URL с параметрами
export const updateURLParams = (
  router: ReturnType<typeof useRouter>,
  params: Record<string, string | number | boolean | undefined | null>
) => {
  // Получение текущего URL
  const url = new URL(window.location.href);
  
  // Обновление или добавление новых параметров
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  
  // Изменение URL без перезагрузки страницы
  router.push(url.pathname + url.search);
};

// Хук для получения параметров из URL
export const useUrlParams = () => {
  const searchParams = useSearchParams();
  
  return {
    getParam: (name: string, defaultValue?: string): string => 
      searchParams.get(name) || defaultValue || '',
      
    getNumParam: (name: string, defaultValue: number): number => {
      const value = searchParams.get(name);
      return value ? parseInt(value, 10) : defaultValue;
    },
    
    getBoolParam: (name: string, defaultValue: boolean): boolean => {
      const value = searchParams.get(name);
      if (value === null) return defaultValue;
      return value === 'true';
    }
  };
}; 