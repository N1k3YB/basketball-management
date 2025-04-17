'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { formatPlayerPosition } from '@/lib/utils';
import { 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { Pagination } from '@/components/ui/Pagination';
import { updateURLParams, useUrlParams } from '@/lib/urlParams';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import BasketballSpinner from '@/components/ui/BasketballSpinner';

// Типы для статистики игроков
interface PlayerStats {
  id: string;
  userId: string; // ID пользователя для навигации к профилю
  name: string; // ФИО игрока
  team: string;
  position: string;
  gamesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  minutesPlayed: number;
}

// Типы для статистики команд
interface TeamStats {
  id: string;
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
}

export default function StatsPage() {
  const router = useRouter();
  const urlParams = useUrlParams();
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>(
    urlParams.getParam('tab', 'players') as 'players' | 'teams'
  );
  const [playerSort, setPlayerSort] = useState<{ field: keyof PlayerStats, ascending: boolean }>({
    field: urlParams.getParam('playerSortField', 'points') as keyof PlayerStats,
    ascending: urlParams.getBoolParam('playerSortAsc', false)
  });
  const [teamSort, setTeamSort] = useState<{ field: keyof TeamStats, ascending: boolean }>({
    field: urlParams.getParam('teamSortField', 'winPercentage') as keyof TeamStats,
    ascending: urlParams.getBoolParam('teamSortAsc', false)
  });
  const [playerSearch, setPlayerSearch] = useState(urlParams.getParam('playerSearch', ''));
  const [teamSearch, setTeamSearch] = useState(urlParams.getParam('teamSearch', ''));
  const [playerPage, setPlayerPage] = useState(urlParams.getNumParam('playerPage', 1));
  const [teamPage, setTeamPage] = useState(urlParams.getNumParam('teamPage', 1));
  const itemsPerPage = 15;

  // Функция загрузки статистики
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загрузка статистики игроков
      const playersResponse = await fetch('/api/coach/stats/players');
      if (!playersResponse.ok) {
        throw new Error(`Ошибка при загрузке статистики игроков: ${playersResponse.status}`);
      }
      const playersData = await playersResponse.json();
      setPlayerStats(playersData);
      
      // Загрузка статистики команд
      const teamsResponse = await fetch('/api/coach/stats/teams');
      if (!teamsResponse.ok) {
        throw new Error(`Ошибка при загрузке статистики команд: ${teamsResponse.status}`);
      }
      const teamsData = await teamsResponse.json();
      setTeamStats(teamsData);
      
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      setError('Не удалось загрузить статистику. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Обновление URL-параметров при изменении состояния
  useEffect(() => {
    updateURLParams(router, {
      tab: activeTab,
      playerSortField: playerSort.field !== 'points' ? playerSort.field : null,
      playerSortAsc: playerSort.ascending === true ? 'true' : null,
      teamSortField: teamSort.field !== 'winPercentage' ? teamSort.field : null,
      teamSortAsc: teamSort.ascending === true ? 'true' : null,
      playerSearch: playerSearch || null,
      teamSearch: teamSearch || null,
      playerPage: playerPage !== 1 ? playerPage : null,
      teamPage: teamPage !== 1 ? teamPage : null
    });
  }, [
    activeTab, 
    playerSort.field, 
    playerSort.ascending, 
    teamSort.field, 
    teamSort.ascending, 
    playerSearch,
    teamSearch,
    playerPage,
    teamPage,
    router
  ]);

  // Функция фильтрации статистики игроков
  const filteredPlayerStats = playerStats.filter(player => 
    playerSearch === '' || 
    player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    player.team.toLowerCase().includes(playerSearch.toLowerCase()) ||
    player.position.toLowerCase().includes(playerSearch.toLowerCase())
  );

  // Функция фильтрации статистики команд
  const filteredTeamStats = teamStats.filter(team => 
    teamSearch === '' || 
    team.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  // Сортировка статистики игроков
  const sortedPlayerStats = [...filteredPlayerStats].sort((a, b) => {
    const aValue = a[playerSort.field];
    const bValue = b[playerSort.field];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return playerSort.ascending 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    } else {
      return playerSort.ascending 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    }
  });

  // Сортировка статистики команд
  const sortedTeamStats = [...filteredTeamStats].sort((a, b) => {
    const aValue = a[teamSort.field];
    const bValue = b[teamSort.field];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return teamSort.ascending 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    } else {
      return teamSort.ascending 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    }
  });

  // Пагинация игроков
  const playerTotalPages = Math.ceil(sortedPlayerStats.length / itemsPerPage);
  const paginatedPlayerStats = sortedPlayerStats.slice(
    (playerPage - 1) * itemsPerPage,
    playerPage * itemsPerPage
  );

  // Пагинация команд
  const teamTotalPages = Math.ceil(sortedTeamStats.length / itemsPerPage);
  const paginatedTeamStats = sortedTeamStats.slice(
    (teamPage - 1) * itemsPerPage,
    teamPage * itemsPerPage
  );

  // Обработка сортировки для игроков
  const handlePlayerSort = (field: keyof PlayerStats) => {
    setPlayerSort(prev => ({
      field,
      ascending: prev.field === field ? !prev.ascending : false,
    }));
    setPlayerPage(1); // Сброс на первую страницу при изменении сортировки
  };

  // Обработка сортировки для команд
  const handleTeamSort = (field: keyof TeamStats) => {
    setTeamSort(prev => ({
      field,
      ascending: prev.field === field ? !prev.ascending : false,
    }));
    setTeamPage(1); // Сброс на первую страницу при изменении сортировки
  };

  // Функция для отображения стрелки сортировки
  const renderSortArrow = (field: string, currentSort: { field: string, ascending: boolean }) => {
    if (currentSort.field !== field) return null;
    return currentSort.ascending ? '↑' : '↓';
  };

  // Функция навигации к профилю игрока
  const navigateToPlayerProfile = (playerId: string, userId?: string) => {
    // Если доступен userId, использование его для навигации к профилю пользователя
    // В противном случае использование id игрока (для обратной совместимости)
    router.push(`/profile/${userId || playerId}`);
  };

  // Функция навигации к профилю команды
  const navigateToTeamProfile = (teamId: string) => {
    router.push(`/coach/teams/${teamId}`);
  };

  // Функция для экспорта в PDF
  const exportToPDF = async () => {
    try {
      // Установка состояния загрузки
      setExporting(true);
      
      // Количество записей на одной странице PDF
      const itemsPerPdfPage = 15;
      
      // Получение данных в зависимости от активной вкладки
      const allData = activeTab === 'players' ? sortedPlayerStats : sortedTeamStats;
      
      // Расчет количества страниц PDF
      const totalPdfPages = Math.ceil(allData.length / itemsPerPdfPage);
      
      // Создание PDF документа в альбомной ориентации
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Получение размеров PDF страницы
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Обработка каждой страницы PDF
      for (let pdfPage = 0; pdfPage < totalPdfPages; pdfPage++) {
        // Если не первая страница, добавление новой
        if (pdfPage > 0) {
          pdf.addPage();
        }
        
        // Определение диапазона данных для текущей страницы
        const startIdx = pdfPage * itemsPerPdfPage;
        const endIdx = Math.min(startIdx + itemsPerPdfPage, allData.length);
        const pageData = allData.slice(startIdx, endIdx);
        
        // Создание HTML контейнера для экспорта
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '-9999px';
        printContainer.style.padding = '20px';
        printContainer.style.backgroundColor = 'white';
        printContainer.style.width = '1100px'; // Фиксированная ширина для лучшего качества
        
        // Добавление заголовка только на первой странице
        if (pdfPage === 0) {
          const headerDiv = document.createElement('div');
          headerDiv.style.marginBottom = '20px';
          headerDiv.style.fontFamily = 'Arial, sans-serif';
          
          const titleElement = document.createElement('h1');
          titleElement.textContent = activeTab === 'players' ? 'Статистика игроков' : 'Статистика команд';
          titleElement.style.fontSize = '24px';
          titleElement.style.marginBottom = '10px';
          
          const dateElement = document.createElement('p');
          const currentDate = new Date();
          dateElement.textContent = `Дата экспорта: ${currentDate.getDate()}.${currentDate.getMonth() + 1}.${currentDate.getFullYear()}`;
          dateElement.style.fontSize = '14px';
          
          headerDiv.appendChild(titleElement);
          headerDiv.appendChild(dateElement);
          printContainer.appendChild(headerDiv);
        }
        
        // Информация о страницах PDF
        const pageInfoDiv = document.createElement('div');
        pageInfoDiv.style.marginBottom = '10px';
        pageInfoDiv.style.fontFamily = 'Arial, sans-serif';
        pageInfoDiv.style.textAlign = 'right';
        pageInfoDiv.style.fontSize = '12px';
        
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Страница ${pdfPage + 1} из ${totalPdfPages}`;
        pageInfoDiv.appendChild(pageInfo);
        printContainer.appendChild(pageInfoDiv);
        
        // Создание таблицы для текущей страницы
        const tableElement = document.createElement('table');
        tableElement.style.width = '100%';
        tableElement.style.borderCollapse = 'collapse';
        tableElement.style.fontFamily = 'Arial, sans-serif';
        tableElement.style.marginBottom = '20px';
        tableElement.style.border = '1px solid #e2e8f0';
        
        // Добавление стилей для ячеек таблицы
        const tableStyle = document.createElement('style');
        tableStyle.textContent = `
          th, td {
            padding: 8px;
            border: 1px solid #e2e8f0;
          }
          th {
            background-color: #2980b9;
            color: white;
            font-weight: bold;
            text-align: left;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
        `;
        printContainer.appendChild(tableStyle);
        
        // Создание заголовков таблицы
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        if (activeTab === 'players') {
          // Заголовки для игроков
          const headers = [
            'Игрок', 'Команда', 'Позиция', 'Игры', 'Очки', 
            'Подборы', 'Передачи', 'Перехваты', 'Блоки', 'Минуты'
          ];
          
          headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          tableElement.appendChild(thead);
          
          // Добавление данных для текущей страницы
          const tbody = document.createElement('tbody');
          (pageData as PlayerStats[]).forEach(player => {
            const row = document.createElement('tr');
            
            // Добавление ячеек для каждого столбца
            const addCell = (text: string) => {
              const td = document.createElement('td');
              td.textContent = text;
              row.appendChild(td);
            };
            
            addCell(player.name || '');
            addCell(player.team || '');
            addCell(formatPlayerPosition(player.position || ''));
            addCell(player.gamesPlayed !== undefined ? player.gamesPlayed.toString() : '0');
            addCell(player.points !== undefined ? player.points.toString() : '0');
            addCell(player.rebounds !== undefined ? player.rebounds.toString() : '0');
            addCell(player.assists !== undefined ? player.assists.toString() : '0');
            addCell(player.steals !== undefined ? player.steals.toString() : '0');
            addCell(player.blocks !== undefined ? player.blocks.toString() : '0');
            addCell(player.minutesPlayed !== undefined ? player.minutesPlayed.toString() : '0');
            
            tbody.appendChild(row);
          });
          tableElement.appendChild(tbody);
        } else {
          // Заголовки для команд
          const headers = [
            'Команда', 'Игры', 'Победы', 'Поражения', 'Ничьи', 
            '% побед', 'Очки ЗА', 'Очки ПРОТИВ'
          ];
          
          headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          tableElement.appendChild(thead);
          
          // Добавление данных для текущей страницы
          const tbody = document.createElement('tbody');
          (pageData as TeamStats[]).forEach(team => {
            const row = document.createElement('tr');
            
            // Добавление ячеек для каждого столбца
            const addCell = (text: string) => {
              const td = document.createElement('td');
              td.textContent = text;
              row.appendChild(td);
            };
            
            addCell(team.name || '');
            addCell(team.gamesPlayed !== undefined ? team.gamesPlayed.toString() : '0');
            addCell(team.wins !== undefined ? team.wins.toString() : '0');
            addCell(team.losses !== undefined ? team.losses.toString() : '0');
            addCell(team.draws !== undefined ? team.draws.toString() : '0');
            addCell((typeof team.winPercentage === 'number' ? team.winPercentage.toFixed(1) : '0.0') + '%');
            addCell(team.pointsFor !== undefined ? team.pointsFor.toString() : '0');
            addCell(team.pointsAgainst !== undefined ? team.pointsAgainst.toString() : '0');
            
            tbody.appendChild(row);
          });
          tableElement.appendChild(tbody);
        }
        
        // Добавление таблицы в контейнер
        printContainer.appendChild(tableElement);
        
        // Информация о диапазоне записей на текущей странице
        const infoElement = document.createElement('p');
        infoElement.style.fontSize = '12px';
        infoElement.style.marginTop = '10px';
        infoElement.style.textAlign = 'right';
        infoElement.textContent = `Записи ${startIdx + 1}-${endIdx} из ${allData.length}`;
        printContainer.appendChild(infoElement);
        
        // Добавление контейнера в DOM
        document.body.appendChild(printContainer);
        
        try {
          // Создание скриншота контейнера с таблицей
          const canvas = await html2canvas(printContainer, {
            scale: 1.5, // Увеличение масштаба для лучшего качества
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: 'white'
          });
          
          // Получение соотношения сторон изображения
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          // Уменьшение коэффициента масштабирования, чтобы добавить дополнительный отступ снизу
          const ratio = Math.min(pageWidth / imgWidth, (pageHeight - 20) / imgHeight);
          
          // Вычисление оптимальных размеров для вставки изображения
          const imgWidthScaled = imgWidth * ratio;
          const imgHeightScaled = imgHeight * ratio;
          
          // Центрирование изображения на странице и добавление верхнего отступа
          const x = (pageWidth - imgWidthScaled) / 2;
          const y = 10; // Отступ сверху
          
          // Добавление изображения на страницу PDF
          const imageData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imageData, 'JPEG', x, y, imgWidthScaled, imgHeightScaled);
          
        } finally {
          // Удаление временного контейнера из DOM
          document.body.removeChild(printContainer);
        }
      }
      
      // Сохранение PDF
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const dateTimeStr = `${day}-${month}-${year}_${hours}-${minutes}`;
      const fileTitle = activeTab === 'players' ? 'статистика_игроков' : 'статистика_команд';
      const fileName = `${fileTitle}_${dateTimeStr}.pdf`;
      
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      alert('Произошла ошибка при создании PDF. Попробуйте экспорт в Excel.');
    } finally {
      // Снятие состояния загрузки
      setExporting(false);
    }
  };
  
  // Функция для экспорта в Excel
  const exportToExcel = () => {
    try {
      // Установка состояния загрузки
      setExporting(true);
      
      // Формирование имени файла с датой и временем
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const dateTimeStr = `${day}-${month}-${year}_${hours}-${minutes}`;
      const fileTitle = activeTab === 'players' ? 'статистика_игроков' : 'статистика_команд';
      const fileName = `${fileTitle}_${dateTimeStr}.xlsx`;
      
      const title = activeTab === 'players' ? 'Статистика игроков' : 'Статистика команд';
      
      let data = [];
      
      if (activeTab === 'players') {
        // Заголовки для игроков
        const headers = [
          'Игрок', 'Команда', 'Позиция', 'Игры', 'Очки', 
          'Подборы', 'Передачи', 'Перехваты', 'Блоки', 'Минуты'
        ];
        
        // Данные для игроков
        data = [
          headers,
          ...sortedPlayerStats.map(player => [
            player.name,
            player.team,
            formatPlayerPosition(player.position),
            player.gamesPlayed,
            player.points,
            player.rebounds,
            player.assists,
            player.steals,
            player.blocks,
            player.minutesPlayed
          ])
        ];
      } else {
        // Заголовки для команд
        const headers = [
          'Команда', 'Игры', 'Победы', 'Поражения', 'Ничьи', 
          '% побед', 'Очки ЗА', 'Очки ПРОТИВ'
        ];
        
        // Данные для команд
        data = [
          headers,
          ...sortedTeamStats.map(team => [
            team.name,
            team.gamesPlayed,
            team.wins,
            team.losses,
            team.draws,
            typeof team.winPercentage === 'number' ? team.winPercentage.toFixed(1) + '%' : '0.0%',
            team.pointsFor,
            team.pointsAgainst
          ])
        ];
      }
      
      // Создание рабочей книги Excel
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title);
      
      // Сохранение файла
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Ошибка при создании Excel:', error);
      alert('Произошла ошибка при создании Excel файла.');
    } finally {
      // Снятие состояния загрузки
      setExporting(false);
    }
  };

  // Обновление функции экспорта для использования новых методов
  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      exportToPDF();
    } else {
      exportToExcel();
    }
  };

  // Функция для обновления данных
  const handleRefresh = () => {
    fetchStats();
  };

  // Обработка изменения страницы для игроков
  const handlePlayerPageChange = (page: number) => {
    setPlayerPage(page);
    window.scrollTo(0, 0);
  };

  // Обработка изменения страницы для команд
  const handleTeamPageChange = (page: number) => {
    setTeamPage(page);
    window.scrollTo(0, 0);
  };

  // Обработка изменения вкладки
  const handleTabChange = (tab: 'players' | 'teams') => {
    setActiveTab(tab);
  };

  return (
    <RoleProtectedLayout allowedRoles={['COACH']}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Статистика команд и игроков</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleExport('pdf')}
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Экспорт в PDF
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleExport('excel')}
            >
              <DocumentTextIcon className="h-5 w-5" />
              Экспорт в Excel
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleRefresh}
            >
              <ArrowPathIcon className="h-5 w-5" />
              Обновить
            </Button>
          </div>
        </div>

        {/* Переключатель вкладок */}
        <div className="flex border-b border-gray-200">
          <button
            className={`tab ${activeTab === 'players' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('players')}
          >
            Статистика игроков
          </button>
          <button
            className={`tab ${activeTab === 'teams' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('teams')}
          >
            Статистика команд
          </button>
        </div>

        {loading || exporting ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка статистики..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Поле поиска для игроков */}
            {activeTab === 'players' && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Поиск по имени игрока, команде или позиции"
                  value={playerSearch}
                  onChange={(e) => {
                    setPlayerSearch(e.target.value);
                    setPlayerPage(1); // Сброс на первую страницу при изменении поиска
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            {/* Поле поиска для команд */}
            {activeTab === 'teams' && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Поиск по названию команды"
                  value={teamSearch}
                  onChange={(e) => {
                    setTeamSearch(e.target.value);
                    setTeamPage(1); // Сброс на первую страницу при изменении поиска
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            {/* Таблица статистики игроков */}
            {activeTab === 'players' && (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        onClick={() => handlePlayerSort('name')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Игрок {renderSortArrow('name', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('team')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Команда {renderSortArrow('team', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('position')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Позиция {renderSortArrow('position', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('gamesPlayed')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Игры {renderSortArrow('gamesPlayed', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('points')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Очки {renderSortArrow('points', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('rebounds')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Подборы {renderSortArrow('rebounds', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('assists')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Передачи {renderSortArrow('assists', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('steals')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Перехваты {renderSortArrow('steals', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('blocks')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Блоки {renderSortArrow('blocks', playerSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handlePlayerSort('minutesPlayed')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Минуты {renderSortArrow('minutesPlayed', playerSort)}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPlayerStats.length > 0 ? (
                      paginatedPlayerStats.map((player) => (
                        <TableRow 
                          key={player.id} 
                          onClick={() => navigateToPlayerProfile(player.id, player.userId)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <TableCell className="font-medium">
                            {player.name}
                          </TableCell>
                          <TableCell>{player.team}</TableCell>
                          <TableCell>{formatPlayerPosition(player.position)}</TableCell>
                          <TableCell>{player.gamesPlayed}</TableCell>
                          <TableCell>{player.points}</TableCell>
                          <TableCell>{player.rebounds}</TableCell>
                          <TableCell>{player.assists}</TableCell>
                          <TableCell>{player.steals}</TableCell>
                          <TableCell>{player.blocks}</TableCell>
                          <TableCell>{player.minutesPlayed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-4">
                          {playerSearch ? 'Нет игроков, соответствующих критериям поиска' : 'Нет статистики игроков'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Пагинация для игроков */}
                {filteredPlayerStats.length > 0 && (
                  <Pagination
                    currentPage={playerPage}
                    totalPages={playerTotalPages}
                    onPageChange={handlePlayerPageChange}
                  />
                )}
                
                {/* Информация о количестве найденных игроков */}
                {filteredPlayerStats.length > 0 && (
                  <div className="text-sm text-gray-500 text-center mt-2 mb-4">
                    Найдено игроков: {filteredPlayerStats.length}
                  </div>
                )}
              </div>
            )}

            {/* Таблица статистики команд */}
            {activeTab === 'teams' && (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        onClick={() => handleTeamSort('name')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Команда {renderSortArrow('name', teamSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handleTeamSort('gamesPlayed')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Игры {renderSortArrow('gamesPlayed', teamSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handleTeamSort('wins')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Победы {renderSortArrow('wins', teamSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handleTeamSort('losses')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Поражения {renderSortArrow('losses', teamSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handleTeamSort('draws')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Ничьи {renderSortArrow('draws', teamSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handleTeamSort('winPercentage')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        % побед {renderSortArrow('winPercentage', teamSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handleTeamSort('pointsFor')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Очки ЗА {renderSortArrow('pointsFor', teamSort)}
                      </TableHead>
                      <TableHead 
                        onClick={() => handleTeamSort('pointsAgainst')}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        Очки ПРОТИВ {renderSortArrow('pointsAgainst', teamSort)}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTeamStats.length > 0 ? (
                      paginatedTeamStats.map((team) => (
                        <TableRow 
                          key={team.id} 
                          onClick={() => navigateToTeamProfile(team.id)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <TableCell className="font-medium">
                            {team.name}
                          </TableCell>
                          <TableCell>{team.gamesPlayed}</TableCell>
                          <TableCell>{team.wins}</TableCell>
                          <TableCell>{team.losses}</TableCell>
                          <TableCell>{team.draws}</TableCell>
                          <TableCell>{typeof team.winPercentage === 'number' ? team.winPercentage.toFixed(1) : '0.0'}%</TableCell>
                          <TableCell>{team.pointsFor}</TableCell>
                          <TableCell>{team.pointsAgainst}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          {teamSearch ? 'Нет команд, соответствующих критериям поиска' : 'Нет статистики команд'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Пагинация для команд */}
                {filteredTeamStats.length > 0 && (
                  <Pagination
                    currentPage={teamPage}
                    totalPages={teamTotalPages}
                    onPageChange={handleTeamPageChange}
                  />
                )}
                
                {/* Информация о количестве найденных команд */}
                {filteredTeamStats.length > 0 && (
                  <div className="text-sm text-gray-500 text-center mt-2 mb-4">
                    Найдено команд: {filteredTeamStats.length}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </RoleProtectedLayout>
  );
} 