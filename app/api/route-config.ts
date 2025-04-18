// Глобальные настройки для всех API маршрутов
// Этот файл нужно импортировать в каждый API маршрут

// Указываем, что все API маршруты должны быть динамическими
export const dynamic = 'force-dynamic';

// Указываем среду выполнения
export const runtime = 'nodejs';

// Функция для проверки авторизации (пример использования)
export const checkAuth = async (session: any, allowedRoles: string[] = []) => {
  if (!session) {
    return {
      isAuthorized: false,
      error: 'Необходима авторизация',
      status: 401
    };
  }

  if (allowedRoles.length > 0) {
    const userRole = (session.user?.role || '').toUpperCase();
    if (!allowedRoles.includes(userRole)) {
      return {
        isAuthorized: false,
        error: 'Недостаточно прав для доступа',
        status: 403
      };
    }
  }

  return {
    isAuthorized: true
  };
}; 