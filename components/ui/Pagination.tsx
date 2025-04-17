import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const pages: (number | string)[] = [];
  
  // Создание массива страниц для отображения, включая соседние страницы и крайние
  const displayedPages = () => {
    if (totalPages <= 5) return pages;
    
    // Всегда отображение первой страницы
    pages.push(1);
    
    // Вычисление начальной и конечной страницы для показа
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Добавление многоточия, если нужно
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Добавление соседних страниц
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Добавление многоточия в конце, если нужно
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Всегда отображение последней страницы
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center items-center space-x-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {displayedPages().map((page, index) => 
        typeof page === 'number' ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="px-2">
            {page}
          </span>
        )
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <span className="text-sm text-gray-500 ml-2">
        Страница {currentPage} из {totalPages}
      </span>
    </div>
  );
}; 