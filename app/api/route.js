// Глобальная конфигурация для всех API маршрутов
// Next.js будет использовать эти настройки для всех маршрутов в каталоге /api

// Указываем, что все API маршруты должны быть динамическими
export const dynamic = 'force-dynamic';

// Указываем среду выполнения
export const runtime = 'nodejs';

// Экспортируем пустой объект для обработки корневого маршрута /api
export function GET() {
  return new Response(JSON.stringify({
    message: 'API работает в динамическом режиме'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 