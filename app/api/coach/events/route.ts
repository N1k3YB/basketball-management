export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Перенаправляем запросы GET на /api/events
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Проверка роли пользователя (только COACH)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'COACH') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуется роль тренера.' },
        { status: 403 }
      );
    }

    // Перенаправляем запрос на общий API событий
    const apiUrl = new URL(request.url);
    const baseUrl = apiUrl.origin;
    const eventsEndpoint = `${baseUrl}/api/events${apiUrl.search}`;
    
    const response = await fetch(eventsEndpoint, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ошибка при получении событий тренера:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении событий тренера' },
      { status: 500 }
    );
  }
}

// Перенаправляем запросы POST на /api/events
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Проверка роли пользователя (только COACH)
    const userRole = (session.user?.role || '').toUpperCase();
    if (userRole !== 'COACH') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуется роль тренера.' },
        { status: 403 }
      );
    }

    // Получаем данные запроса
    const requestData = await request.json();
    
    // Перенаправляем запрос на общий API событий
    const apiUrl = new URL(request.url);
    const baseUrl = apiUrl.origin;
    const eventsEndpoint = `${baseUrl}/api/events`;
    
    const response = await fetch(eventsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Ошибка при создании события тренера:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании события тренера' },
      { status: 500 }
    );
  }
} 