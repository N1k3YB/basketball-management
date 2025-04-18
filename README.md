# Система управления баскетбольным клубом
Полнофункциональное веб-приложение для управления баскетбольными командами, игроками, тренерами, тренировками, матчами и статистикой. Система предоставляет удобный интерфейс для администраторов, тренеров и игроков, позволяя эффективно организовывать и контролировать все аспекты деятельности баскетбольного клуба.

## Возможности системы

```mermaid
graph LR
    A[Система управления<br>баскетбольным клубом] --> B[Управление пользователями]
    A --> C[Управление профилями]
    A --> D[Управление командами]
    A --> E[Планирование событий]
    A --> G[Ведение статистики]
    A --> H[Формирование отчетов]
    A --> I[Просмотр расписания]
    
    subgraph "Управление пользователями"
        B --> B1[Создание учетных записей]
        B --> B2[Назначение ролей]
        B --> B3[Блокировка/разблокировка]
    end
    
    subgraph "Планирование событий"
        E --> E1[Тренировки]
        E --> E2[Матчи]
        E --> E3[Собрания]
        E --> E4[Другие события]
    end
    
    subgraph "Ведение статистики"
        G --> G1[Статистика игроков]
        G --> G2[Статистика команд]
        G --> G3[Статистика матчей]
    end
```
*Основной функционал системы управления баскетбольным клубом*

### Основной функционал

- **Управление пользователями** с разными ролями (администратор, тренер, игрок)
- **Управление профилями игроков и тренеров**
- **Создание и управление командами**
- **Планирование событий** (тренировки, матчи, собрания)
- **Ведение статистики** игроков и команд
- **Формирование отчетов**
- **Просмотр расписания**
- **Полное редактирование профиля**

### Роли пользователей

```mermaid
graph TD
    A[Система управления<br>баскетбольным клубом] --> B[Администратор]
    A --> C[Тренер]
    A --> D[Игрок]
    
    B -->|Полный доступ| E[Управление пользователями]
    B -->|Полный доступ| F[Управление командами]
    B -->|Полный доступ| G[Управление событиями]
    B -->|Полный доступ| H[Просмотр статистики]
    B -->|Полный доступ| I[Формирование отчетов]
    
    C -->|Ограниченный доступ| F1[Управление своими командами]
    C -->|Ограниченный доступ| G1[Управление тренировками]
    C -->|Ограниченный доступ| H1[Просмотр статистики игроков]
    
    D -->|Минимальный доступ| J[Просмотр своего профиля]
    D -->|Минимальный доступ| K[Просмотр расписания]
    D -->|Минимальный доступ| L[Просмотр своей статистики]
```
*Схема взаимодействия пользователей с разными ролями в системе*

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

```mermaid
graph TD
    subgraph "Клиентская часть"
        A[Next.js 14] --> B[React 18]
        B --> C1[Компоненты UI]
        C1 --> D1[TailwindCSS]
        C1 --> D2[Radix UI]
        C1 --> D3[Lucide React]
        B --> C2[Управление формами]
        C2 --> D4[React Hook Form]
        B --> C3[Работа с датами]
        C3 --> D5[React Datepicker]
        C3 --> D6[React Calendar]
        B --> C4[Визуализация данных]
        C4 --> D7[Chart.js/React-ChartJS-2]
        C4 --> D8[Recharts]
        B --> C5[Экспорт данных]
        C5 --> D9[XLSX]
        C5 --> D10[JSPDF]
    end
    
    subgraph "Серверная часть"
        E[Next.js API Routes] --> F[Аутентификация]
        F --> G1[NextAuth.js]
        E --> H[Работа с базой данных]
        H --> G2[Prisma ORM]
        E --> I[Безопасность]
        I --> G3[bcrypt/bcryptjs]
        E --> J[Валидация данных]
        J --> G4[Zod]
        E --> K[Кеширование]
        K --> G5[SWR]
    end
    
    subgraph "База данных"
        L[PostgreSQL]
    end
    
    A -.-> E
    E -.-> L
```
*Схема архитектуры системы и взаимодействия компонентов*

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

## Интерфейсы системы

### Процесс аутентификации
```mermaid
sequenceDiagram
    participant U as Пользователь
    participant F as Фронтенд
    participant A as API
    participant NA as NextAuth.js
    participant DB as База данных
    
    U->>F: Вход в систему
    F->>A: POST /api/auth/signin
    A->>NA: Передача учетных данных
    NA->>DB: Проверка учетных данных
    DB-->>NA: Результат проверки
    
    alt Успешная аутентификация
        NA-->>A: Создание сессии
        A-->>F: Установка куки сессии
        F-->>U: Редирект на главную страницу
    else Ошибка аутентификации
        NA-->>A: Сообщение об ошибке
        A-->>F: Передача ошибки
        F-->>U: Отображение ошибки
    end
```
*Процесс аутентификации пользователей в системе*

### Интерфейсы для разных ролей

#### Панель администратора
```mermaid
graph TD
    A[Панель администратора] --> B[Управление пользователями]
    A --> C[Управление командами]
    A --> D[Управление событиями]
    A --> E[Статистика и отчеты]
    
    B --> B1[Создание пользователей]
    B --> B2[Редактирование пользователей]
    B --> B3[Удаление пользователей]
    
    C --> C1[Создание команды]
    C --> C2[Редактирование команды]
    C --> C3[Управление составом]
    
    D --> D1[Создание событий]
    D --> D2[Календарь и расписание]
    D --> D3[Управление матчами]
    
    E --> E1[Просмотр статистики]
    E --> E2[Формирование отчетов]
    E --> E3[Экспорт данных]
```
*Панель управления администратора с доступом ко всем функциям системы*

#### Интерфейс тренера
```mermaid
graph TD
    A[Интерфейс тренера] --> B[Управление командами]
    A --> C[Тренировки и матчи]
    A --> D[Игроки]
    A --> E[Статистика]
    
    B --> B1[Просмотр своих команд]
    B --> B2[Редактирование команды]
    
    C --> C1[Планирование тренировок]
    C --> C2[Расписание матчей]
    
    D --> D1[Просмотр профилей]
    D --> D2[Управление составом]
    
    E --> E1[Просмотр статистики игроков]
    E --> E2[Просмотр статистики команды]
    E --> E3[Внесение статистики матчей]
```
*Рабочее пространство тренера для управления командами и тренировками*

#### Интерфейс игрока
```mermaid
graph TD
    A[Интерфейс игрока] --> B[Профиль]
    A --> C[Расписание]
    A --> D[Статистика]
    A --> E[Команда]
    
    B --> B1[Просмотр профиля]
    B --> B2[Редактирование профиля]
    
    C --> C1[Тренировки]
    C --> C2[Матчи]
    C --> C3[Другие события]
    
    D --> D1[Персональная статистика]
    D --> D2[История матчей]
    
    E --> E1[Состав команды]
    E --> E2[Тренеры]
```
*Личный кабинет игрока с расписанием и статистикой*

## Функциональность

### Календарь и расписание
```mermaid
graph TD
    A[Календарь событий] --> B[Тренировки]
    A --> C[Матчи]
    A --> D[Собрания]
    A --> E[Другие события]
    
    B --> B1[Регулярные тренировки]
    B --> B2[Специальные тренировки]
    
    C --> C1[Домашние матчи]
    C --> C2[Выездные матчи]
    C --> C3[Товарищеские игры]
    
    D --> D1[Командные собрания]
    D --> D2[Административные собрания]
    
    subgraph "Функции"
        F[Создание события]
        G[Редактирование события]
        H[Отмена события]
    end
```
*Календарь тренировок, матчей и других событий команды*

### Статистика и аналитика

#### Статистика игрока
```mermaid
graph TD
    A[Статистика игрока] --> B[Игровая статистика]
    A --> C[Тренировочная статистика]
    A --> D[Физические показатели]
    
    B --> B1[Очки]
    B --> B2[Подборы]
    B --> B3[Передачи]
    B --> B4[Перехваты]
    B --> B5[Блоки]
    B --> B6[Потери]
    B --> B7[Фолы]
    
    C --> C2[Прогресс навыков]
    
    D --> D1[Рост]
    D --> D2[Вес]
    D --> D3[Физические тесты]
    
    subgraph "Визуализация"
        E[Графики прогресса]
        F[Сравнительные диаграммы]
        G[Тепловые карты]
    end
```
*Детальная статистика игрока с графиками эффективности*

#### Статистика команды
```mermaid
graph TD
    A[Статистика команды] --> B[Результаты матчей]
    A --> C[Командные показатели]
    A --> D[Сезонная статистика]
    
    B --> B1[Победы/поражения]
    B --> B2[Разница очков]
    
    C --> C1[Набранные очки]
    C --> C2[Пропущенные очки]
    C --> C3[Подборы]
    C --> C4[Передачи]
    C --> C5[Перехваты]
    C --> C6[Блоки]
    
    D --> D1[Позиция в турнирной таблице]
    D --> D2[Статистика по сезонам]
    D --> D3[Тренды и прогнозы]
    
    subgraph "Аналитика"
        E[Статистическая аналитика]
        F[Прогнозы результатов]
        G[Сравнение с другими командами]
    end
```
*Аналитика результатов команды по сезонам и матчам*

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

```mermaid
erDiagram
    ROLE {
        string id PK
        string name
    }
    
    USER {
        string id PK
        string email
        string password
        string role_id FK
    }
    
    PROFILE {
        string id PK
        string user_id FK
        string firstName
        string lastName
        date birthDate
        string phone
    }
    
    COACH {
        string id PK
        string user_id FK
        string specialization
        int experience
    }
    
    PLAYER {
        string id PK
        string user_id FK
        int height
        int weight
        string position
        int jerseyNumber
    }
    
    TEAM {
        string id PK
        string name
        string category
        string coach_id FK
    }
    
    TEAM_PLAYER {
        string id PK
        string team_id FK
        string player_id FK
        date joinDate
    }
    
    EVENT_TYPE {
        string id PK
        string name
    }
    
    EVENT {
        string id PK
        string title
        string description
        datetime startTime
        datetime endTime
        string location
        string event_type_id FK
    }
    
    EVENT_TEAM {
        string id PK
        string event_id FK
        string team_id FK
    }
    
    EVENT_PLAYER {
        string id PK
        string event_id FK
        string player_id FK
        boolean attended
    }
    
    EVENT_COACH {
        string id PK
        string event_id FK
        string coach_id FK
    }
    
    MATCH_STATUS {
        string id PK
        string name
    }
    
    MATCH {
        string id PK
        string event_id FK
        string opponent
        int homeScore
        int awayScore
        string status_id FK
    }
    
    PLAYER_STAT {
        string id PK
        string player_id FK
        string match_id FK
        int points
        int rebounds
        int assists
        int steals
        int blocks
        int turnovers
        int fouls
        int minutesPlayed
    }
    
    ROLE ||--o{ USER : "имеет"
    USER ||--|| PROFILE : "имеет"
    USER ||--o| COACH : "может быть"
    USER ||--o| PLAYER : "может быть"
    COACH ||--o{ TEAM : "тренирует"
    TEAM ||--o{ TEAM_PLAYER : "включает"
    PLAYER ||--o{ TEAM_PLAYER : "состоит в"
    EVENT_TYPE ||--o{ EVENT : "определяет"
    EVENT ||--o{ EVENT_TEAM : "связан с"
    EVENT ||--o{ EVENT_PLAYER : "связан с"
    EVENT ||--o{ EVENT_COACH : "связан с"
    TEAM ||--o{ EVENT_TEAM : "участвует в"
    PLAYER ||--o{ EVENT_PLAYER : "участвует в"
    COACH ||--o{ EVENT_COACH : "участвует в"
    EVENT ||--o| MATCH : "может быть"
    MATCH_STATUS ||--o{ MATCH : "определяет"
    PLAYER ||--o{ PLAYER_STAT : "имеет"
    MATCH ||--o{ PLAYER_STAT : "содержит"
```
*Схема базы данных с основными таблицами и связями*

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

### Вспомогательные скрипты

- **Инициализация базы данных**:
  ```
  npm run db:init
  ```
  Запускает миграции и заполняет базу начальными данными.

- **Генерация статистики игроков**:
  ```
  npm run generate:player-stats
  ```
  Создает или обновляет записи статистики для игроков на основе матчей, в которых они участвуют.
  
  Особенности:
  - Заполняет статистику только для тех матчей, в которых игрок реально участвует согласно данным в базе
  - Учитывается связь между игроками и событиями (через таблицу EventPlayer)
  - При повторном запуске происходит накопление статистики для уже существующих записей
  - Генерируются реалистичные случайные значения для всех показателей
  - Если у игрока нет связанных матчей, он пропускается

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