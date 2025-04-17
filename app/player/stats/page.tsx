'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/Table';
import RoleProtectedLayout from '@/components/layout/RoleProtectedLayout';
import BasketballSpinner from '@/components/ui/BasketballSpinner';
import { Badge } from '@/components/ui/Badge';
import { BarChart, PieChart } from '@/components/ui/Charts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PlayerStats {
  totalGames: number;
  gamesStarted: number;
  minutesPlayed: number;
  pointsPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  averageEfficiency: number;
}

interface GameStats {
  gameId: string;
  eventId: string;
  date: string;
  opponent: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  score: string;
  minutes: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoals: string;
  threePointers: string;
  freeThrows: string;
  efficiency: number;
}

export default function PlayerStatsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/player/stats');
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить статистику игрока');
        }
        
        const data = await response.json();
        setPlayerStats(data.overallStats);
        setGameStats(data.gameStats);
      } catch (error) {
        console.error('Ошибка при загрузке статистики игрока:', error);
        setError('Не удалось загрузить статистику. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
  }, []);

  const getResultColor = (result: string): string => {
    switch (result) {
      case 'WIN':
        return 'bg-green-100 text-green-800';
      case 'LOSS':
        return 'bg-red-100 text-red-800';
      case 'DRAW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultText = (result: string): string => {
    switch (result) {
      case 'WIN':
        return 'П';
      case 'LOSS':
        return 'П';
      case 'DRAW':
        return 'Н';
      default:
        return '-';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const handleRowClick = (eventId: string) => {
    router.push(`/schedule/${eventId}`);
  };

  return (
    <RoleProtectedLayout allowedRoles={['PLAYER']}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Моя статистика</h1>
        
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BasketballSpinner label="Загрузка статистики..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : playerStats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Матчи</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{playerStats.totalGames}</div>
                  <p className="text-sm text-gray-500 mt-1">
                    В стартовом составе: {playerStats.gamesStarted}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Очки за игру</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{playerStats.pointsPerGame.toFixed(1)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Подборы за игру</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{playerStats.reboundsPerGame.toFixed(1)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Передачи за игру</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{playerStats.assistsPerGame.toFixed(1)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Эффективность бросков</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={{
                      labels: ['С игры', 'Трехочковые', 'Штрафные'],
                      datasets: [
                        {
                          data: [
                            playerStats.fieldGoalPercentage,
                            playerStats.threePointPercentage,
                            playerStats.freeThrowPercentage
                          ],
                          backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
                          label: 'Процент попаданий'
                        }
                      ]
                    }}
                    options={{
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top'
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.dataset.label}: ${context.raw}%`;
                            },
                            title: function(context) {
                              return context[0].label;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function(value) {
                              return value + '%';
                            }
                          }
                        },
                        x: {
                          ticks: {
                            font: {
                              weight: 'bold'
                            }
                          }
                        }
                      }
                    }}
                    height={250}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Средняя статистика за игру</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart
                    data={{
                      labels: ['Очки', 'Подборы', 'Передачи', 'Перехваты', 'Блоки', 'Потери'],
                      datasets: [
                        {
                          data: [
                            playerStats.pointsPerGame,
                            playerStats.reboundsPerGame,
                            playerStats.assistsPerGame,
                            playerStats.stealsPerGame,
                            playerStats.blocksPerGame,
                            playerStats.turnoversPerGame
                          ],
                          backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#a855f7', '#2563eb']
                        }
                      ]
                    }}
                    height={250}
                  />
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Последние игры</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Соперник</TableHead>
                        <TableHead>Результат</TableHead>
                        <TableHead>Мин</TableHead>
                        <TableHead>Очк</TableHead>
                        <TableHead>Пд</TableHead>
                        <TableHead>Пб</TableHead>
                        <TableHead>Пх</TableHead>
                        <TableHead>Бл</TableHead>
                        <TableHead>Пт</TableHead>
                        <TableHead>Эфф.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameStats.length > 0 ? (
                        gameStats.map((game) => (
                          <TableRow 
                            key={game.gameId} 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleRowClick(game.eventId)}
                          >
                            <TableCell>{formatDate(game.date)}</TableCell>
                            <TableCell>{game.opponent}</TableCell>
                            <TableCell>
                              <Badge className={getResultColor(game.result)}>
                                {game.score} {getResultText(game.result)}
                              </Badge>
                            </TableCell>
                            <TableCell>{game.minutes}</TableCell>
                            <TableCell className="font-medium">{game.points}</TableCell>
                            <TableCell>{game.assists}</TableCell>
                            <TableCell>{game.rebounds}</TableCell>
                            <TableCell>{game.steals}</TableCell>
                            <TableCell>{game.blocks}</TableCell>
                            <TableCell>{game.turnovers}</TableCell>
                            <TableCell className="font-medium">{game.efficiency}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-4 text-gray-500">
                            Нет данных о сыгранных матчах
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Нет доступной статистики
          </div>
        )}
      </div>
    </RoleProtectedLayout>
  );
} 