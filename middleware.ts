import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Этот middleware файл указывает, что все API маршруты должны быть динамическими
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Определяем, какие маршруты должны использовать этот middleware
export const config = {
  matcher: [
    // Применяем ко всем API маршрутам
    '/api/:path*',
  ],
} 