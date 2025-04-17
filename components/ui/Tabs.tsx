import { ReactNode, createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

// Создание контекста для вкладок
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (id: string) => void;
}>({
  activeTab: '',
  setActiveTab: () => {}
});

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('flex space-x-1 rounded-md bg-gray-100 p-1', className)}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  
  return (
    <button
      type="button"
      className={cn(
        'flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
        activeTab === value 
          ? 'bg-white shadow text-primary-700' 
          : 'text-gray-600 hover:text-gray-800',
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;
  
  return (
    <div className={cn('mt-2', className)}>
      {children}
    </div>
  );
} 