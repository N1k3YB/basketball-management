/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем статический вывод и переходим на серверный рендеринг
  output: 'standalone',
  
  // Отключаем оптимизацию изображений
  images: {
    unoptimized: true,
  },
  
  // Экспериментальные функции
  experimental: {
    // Отключаем статическую оптимизацию
    appDir: true,
    // Устанавливаем тип сборки на серверный рендеринг
    serverActions: {
      bodySizeLimit: '2mb'
    },
  },
  
  // Отключаем статическую генерацию для API маршрутов
  async redirects() {
    return [];
  },
  
  // Указываем заголовки для API маршрутов
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'x-dynamic-api-route',
            value: 'true',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 