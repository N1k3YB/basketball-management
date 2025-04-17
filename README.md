# Система управления баскетбольным клубом

Полнофункциональное веб-приложение для управления баскетбольными командами, игроками, тренерами, тренировками, матчами и статистикой. Система предоставляет удобный интерфейс для администраторов, тренеров и игроков, позволяя эффективно организовывать и контролировать все аспекты деятельности баскетбольного клуба.

## Возможности системы

### Основной функционал

- **Управление пользователями** с разными ролями (администратор, тренер, игрок)
- **Управление профилями игроков и тренеров**
- **Создание и управление командами**
- **Планирование событий** (тренировки, матчи, собрания)
- **Отслеживание посещаемости**
- **Ведение статистики** игроков и команд
- **Формирование отчетов**
- **Просмотр расписания**

### Роли пользователей

#### Администратор
- Полный доступ ко всем функциям системы
- Управление пользователями и их ролями
- Создание и редактирование профилей игроков и тренеров
- Управление всеми командами
- Планирование и организация матчей и тренировок
- Просмотр и анализ всей статистики
- Формирование отчетов

#### Тренер
- Управление своими командами
- Просмотр и управление профилями игроков своих команд
- Планирование и управление тренировками своих команд
- Просмотр расписания матчей
- Внесение и просмотр статистики игроков

#### Игрок
- Просмотр своего профиля
- Редактирование своего профиля
- Просмотр расписания тренировок и матчей своей команды
- Просмотр своей статистики и результатов матчей

## Технический стек

### Фронтенд
- **Next.js 14** - React-фреймворк с серверным рендерингом
- **React 18** - библиотека для создания пользовательских интерфейсов
- **TailwindCSS** - утилитарный CSS-фреймворк
- **Radix UI** - библиотека доступных компонентов React
- **Lucide React** - SVG иконки
- **React Hook Form** - управление формами
- **React Datepicker** и **React Calendar** - компоненты для работы с датами
- **Chart.js/React-ChartJS-2** и **Recharts** - библиотеки для создания графиков
- **XLSX/JSPDF** - экспорт данных

### Бэкенд
- **Next.js API Routes** - серверные API-маршруты
- **NextAuth.js** - аутентификация и авторизация
- **Prisma ORM** - ORM для работы с базой данных
- **bcrypt/bcryptjs** - хеширование паролей
- **Zod** - валидация данных
- **SWR** - кеширование и синхронизация данных

### База данных
- **PostgreSQL** - реляционная база данных

## Требования для запуска

- **Node.js** версии 18.0.0 или выше
- **npm** версии 8.0.0 или выше
- **PostgreSQL** версии 14.0 или выше

## Инструкция по установке и запуску

### 1. Подготовка окружения

#### Установка Node.js
1. Скачайте LTS версию Node.js с [официального сайта](https://nodejs.org/)
2. Установите Node.js, следуя инструкциям установщика
3. Проверьте установку командами:
   ```
   node -v
   npm -v
   ```

#### Установка PostgreSQL
1. Скачайте PostgreSQL с [официального сайта](https://www.postgresql.org/download/)
2. Установите PostgreSQL, запомнив пароль пользователя postgres
3. Создайте новую базу данных:
   ```sql
   CREATE DATABASE basketball_system;
   ```

#### Локальный запуск PostgreSQL
Если вы используете установленный PostgreSQL:
```powershell
# Запуск PostgreSQL сервера (Windows)
# Обычно запускается автоматически как служба Windows
# Проверка статуса службы
sc query postgresql-x64-14

# Запуск службы, если остановлена
net start postgresql-x64-14

# Остановка службы
net stop postgresql-x64-14
```

Если вы используете Docker:
```powershell
# Запуск PostgreSQL в Docker
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=basketball_system -p 5432:5432 -d postgres:14
```

Подключение к базе данных:
```powershell
# Через psql (если установлен)
psql -U postgres -d basketball_system

# Или через pgAdmin (графический интерфейс)
```

### 2. Настройка проекта

#### Клонирование репозитория
```powershell
git clone https://github.com/N1k3YB/basketball-management.git
cd basketball-management
```

#### Установка зависимостей
```powershell
npm install
```

#### Настройка переменных окружения
Создайте файл `.env` в корне проекта:

```
# База данных
DATABASE_URL="postgresql://username:password@localhost:5432/basketball_system?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ваш-секретный-ключ-не-менее-32-символов"

# Общие настройки
NODE_ENV="development"

# Опционально: настройки сервера для доступа со всех IP
HOSTNAME=0.0.0.0
PORT=3000
```

Для генерации NEXTAUTH_SECRET используйте команду:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Альтернативно, через GitBash:
```bash
openssl rand -base64 32
```

### 3. Инициализация базы данных

```powershell
npx prisma migrate deploy
npx prisma db seed
```

Или используйте предустановленный скрипт:

```powershell
npm run db:init
```

### 4. Запуск приложения

#### Режим разработки
```powershell
# Стандартный запуск для локальной разработки
npm run dev

# Альтернативный запуск через npx
npx next dev

# Запуск с доступом по сети (на всех IP адресах)
npm run dev -- -H 0.0.0.0
# или
npx next dev -H 0.0.0.0
```

При запуске на 0.0.0.0 приложение будет доступно:
- Локально: http://localhost:3000
- По IP вашего компьютера в сети: http://ваш_IP:3000

#### Режим продакшена
```powershell
npm run build
npm run start

# Запуск продакшен-версии на всех IP
npm run start -- -H 0.0.0.0
# или 
npx next start -H 0.0.0.0
```

## Учетные данные по умолчанию

### Администратор
- **Email**: admin@example.com
- **Пароль**: admin123

### Тренеры
- **Email**: trener1@example.com (мужская команда)
- **Email**: trener2@example.com (женская команда)
- **Email**: trener3@example.com (юношеская команда)
- **Пароль для всех тренеров**: password123

### Игроки
- **Email**: player1@example.com, player2@example.com, ... (всего 12 игроков в каждой команде)
- **Пароль для всех игроков**: password123

## Структура проекта

```
/
├── app/                    # Основной код приложения (Next.js App Router)
│   ├── api/                # API маршруты
│   ├── admin/              # Страницы для администратора
│   ├── coach/              # Страницы для тренера
│   ├── player/             # Страницы для игрока
│   ├── auth/               # Страницы аутентификации
│   ├── profile/            # Страницы профиля пользователя
│   ├── schedule/           # Страницы расписания
│   ├── page.tsx            # Главная страница
│   └── layout.tsx          # Основной лейаут
├── components/             # Переиспользуемые компоненты
├── lib/                    # Вспомогательные функции и конфигурации
├── prisma/                 # Схема и миграции Prisma
│   ├── schema.prisma       # Схема базы данных
│   └── seed.ts             # Скрипт заполнения базы данных
├── types/                  # Типы TypeScript
├── public/                 # Статические файлы
└── scripts/                # Вспомогательные скрипты
```

## API эндпоинты

### Аутентификация
- **POST /api/auth/[...nextauth]** - NextAuth.js аутентификация

### Пользователи
- **GET /api/users** - получение списка пользователей
- **POST /api/users** - создание пользователя
- **GET /api/users/[id]** - получение информации о пользователе
- **PUT /api/users/[id]** - обновление пользователя
- **DELETE /api/users/[id]** - удаление пользователя

### Игроки
- **GET /api/players** - получение списка игроков (с фильтрацией)
- **POST /api/players** - создание игрока
- **GET /api/players/[id]** - получение информации об игроке
- **PUT /api/players/[id]** - обновление игрока
- **DELETE /api/players/[id]** - удаление игрока
- **GET /api/players/me** - получение данных текущего игрока

### Тренеры
- **GET /api/coach** - получение списка тренеров
- **POST /api/coach** - создание тренера
- **GET /api/coach/[id]** - получение информации о тренере
- **PUT /api/coach/[id]** - обновление тренера

### Команды
- **GET /api/teams** - получение списка команд
- **POST /api/teams** - создание команды
- **GET /api/teams/[id]** - получение информации о команде
- **PUT /api/teams/[id]** - обновление команды
- **DELETE /api/teams/[id]** - удаление команды
- **POST /api/teams/[id]/players** - добавление игрока в команду
- **DELETE /api/teams/[id]/players/[playerId]** - удаление игрока из команды

### События
- **GET /api/events** - получение списка событий
- **POST /api/events** - создание события
- **GET /api/events/[id]** - получение информации о событии
- **PUT /api/events/[id]** - обновление события
- **DELETE /api/events/[id]** - удаление события

### Статистика
- **GET /api/stats/player/[id]** - получение статистики игрока
- **GET /api/stats/team/[id]** - получение статистики команды
- **POST /api/stats/match/[id]** - добавление статистики матча

## Модели базы данных

### Пользователи и роли
- **Role** - роли пользователей (ADMIN, COACH, PLAYER)
- **User** - пользователи системы
- **Profile** - профили пользователей

### Игроки и тренеры
- **Player** - игроки с дополнительной информацией
- **Coach** - тренеры с дополнительной информацией

### Команды
- **Team** - команды
- **TeamPlayer** - связь игрок-команда (многие ко многим)

### События и матчи
- **Event** - события (тренировки, матчи, собрания)
- **EventType** - типы событий (TRAINING, MATCH, MEETING, OTHER)
- **EventTeam** - связь события с командой
- **EventPlayer** - связь события с игроком
- **EventCoach** - связь события с тренером
- **Match** - матчи (расширяет событие)
- **MatchStatus** - статусы матча (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, POSTPONED)

### Статистика
- **PlayerStat** - статистика игрока в матче

## Работа с Prisma

### Основные команды

- **Создание миграций**:
  ```
  npx prisma migrate dev --name название_миграции
  ```

- **Применение миграций**:
  ```
  npx prisma migrate deploy
  ```

- **Сброс базы данных**:
  ```
  npx prisma migrate reset
  ```

- **Заполнение базы данных тестовыми данными**:
  ```
  npx prisma db seed
  ```

- **Просмотр данных через Prisma Studio**:
  ```
  npx prisma studio
  ```

## Дополнительная информация

### Сборка и запуск в Docker

1. Создайте Dockerfile:
```
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Создайте docker-compose.yml:
```yaml
version: '3'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: basketball_system
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  web:
    build: .
    depends_on:
      - db
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/basketball_system
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: your-secret-key
volumes:
  postgres_data:
```

3. Сборка и запуск:
```
docker-compose up -d
```

### Экспорт данных

Система поддерживает экспорт данных в форматах:
- Excel (XLSX)
- PDF

### Решение проблем

#### Проблемы с базой данных
Если возникают проблемы с подключением к базе данных:
1. Проверьте строку подключения в `.env`
2. Убедитесь, что PostgreSQL запущен и доступен
3. Проверьте права доступа пользователя базы данных

#### Сброс и повторная инициализация базы данных
```powershell
npx prisma migrate reset
npm run db:init
```

#### Проблемы с зависимостями
```powershell
rm -rf node_modules
npm install
```