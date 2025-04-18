/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Переход на полный серверный рендеринг
  output: 'server',
  
  // Отключаем оптимизацию изображений
  images: {
    unoptimized: true,
  },
  
  // Устанавливаем, что все страницы должны быть динамическими
  experimental: {
    serverComponents: true,
    appDir: true,
  },
  
  // Явно указываем, что все маршруты должны быть динамическими
  async redirects() {
    return [];
  },
  
  // Добавляем заголовки для API маршрутов
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'x-dynamic-route',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;