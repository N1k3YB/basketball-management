import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// Регистрация компонентов ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// Базовые свойства для всех графиков
interface BaseChartProps {
  title?: string;
  className?: string;
  height?: number;
}

// Столбчатая диаграмма
interface BarChartProps extends BaseChartProps {
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
}

export function BarChart({ title, data, options, className, height = 350 }: BarChartProps) {
  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title || '',
      },
    },
  };

  return (
    <Card className={cn('w-full', className)}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Bar data={data} options={options || defaultOptions} />
        </div>
      </CardContent>
    </Card>
  );
}

// Круговая диаграмма
interface PieChartProps extends BaseChartProps {
  data: ChartData<'pie'>;
  options?: ChartOptions<'pie'>;
}

export function PieChart({ title, data, options, className, height = 350 }: PieChartProps) {
  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: !!title,
        text: title || '',
      },
    },
  };

  return (
    <Card className={cn('w-full', className)}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Pie data={data} options={options || defaultOptions} />
        </div>
      </CardContent>
    </Card>
  );
}

// Линейный график
interface LineChartProps extends BaseChartProps {
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
}

export function LineChart({ title, data, options, className, height = 350 }: LineChartProps) {
  // Для отладки - вывод данных графика
  console.log('LineChart получил данные:', data);

  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title || '',
      },
    },
    scales: {
      x: {
        display: true
      },
      y: {
        display: true,
        beginAtZero: true
      }
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Line data={data} options={options || defaultOptions} />
        </div>
      </CardContent>
    </Card>
  );
} 