## Описание скриптов проекта

Ниже представлено описание уникальных скриптов и ключевых функций данного проекта, разделенных на серверную и клиентскую части.

### Серверные скрипты и конфигурация

1.  **`lib/auth.ts`**: ([Файл](lib/auth.ts))
    *   **`authOptions: NextAuthOptions`**: Центральная конфигурация для NextAuth.js, отвечающая за аутентификацию и управление сессиями.
        *   **`CredentialsProvider`**: Настроен для аутентификации пользователей по их электронной почте и паролю.
            *   **`authorize(credentials)`**: Функция, которая проверяет предоставленные учетные данные пользователя (email и пароль) путем вызова серверной функции `authenticateUser` для валидации в базе данных.
        *   **`callbacks.jwt({ token, user })`**: Коллбэк, вызываемый при создании или обновлении JSON Web Token (JWT). Добавляет идентификатор (ID) и роль пользователя в токен, чтобы эта информация была доступна в дальнейшем.
        *   **`callbacks.session({ session, token })`**: Коллбэк, вызываемый при доступе к сессии. Обогащает стандартный объект сессии дополнительными данными о пользователе (например, имя, фамилия, аватар, ID игрока/тренера). Эти данные извлекаются из базы данных с помощью `getUserById`, а аватар форматируется для отображения с помощью `binaryToImageUrl`.

2.  **`lib/prisma.ts`**: ([Файл](lib/prisma.ts))
    *   **Инициализация PrismaClient**: Этот файл отвечает за создание и экспорт единственного экземпляра `PrismaClient`. Такая практика (синглтон) важна для оптимизации подключений к базе данных и предотвращения их исчерпания, особенно в среде разработки с частыми перезагрузками. Уровни логирования Prisma (например, вывод SQL-запросов) настраиваются в зависимости от окружения (development или production).

3.  **`app/api/auth/[...nextauth]/route.ts`**: ([Файл](app/api/auth/[...nextauth]/route.ts))
    *   **Обработчик NextAuth.js**: Данный файл инициализирует и экспортирует основной обработчик для NextAuth.js. Он использует конфигурацию `authOptions`, импортированную из `lib/auth.ts`, для управления всеми аспектами аутентификации (вход, выход, управление сессиями, OAuth провайдеры и т.д.).

4.  **`lib/db/user.ts`**: ([Файл](lib/db/user.ts))
    *   Содержит набор асинхронных функций для взаимодействия с таблицами пользователей, профилей и ролей в базе данных с использованием Prisma.
    *   **`getUserByEmail(email: string)`**: Находит пользователя в базе данных по его адресу электронной почты. Включает в результат связанную информацию о роли, профиле, а также специфичные данные игрока или тренера, если они существуют.
    *   **`getUserById(id: string)`**: Аналогично `getUserByEmail`, но поиск осуществляется по уникальному идентификатору пользователя. Эта функция активно используется в `lib/auth.ts` для добавления полных данных о пользователе в объект сессии.
    *   **`authenticateUser(email: string, password: string)`**: Аутентифицирует пользователя. Сначала находит пользователя по email, а затем сравнивает предоставленный пароль с хешированным паролем из базы данных с помощью `bcrypt.compare`. Возвращает данные пользователя в случае успеха или `null` при неудаче.
    *   **`createUser(email: string, password: string, roleName: string, profileData: object)`**: Создает нового пользователя и связанный с ним профиль. Пароль перед сохранением хешируется с помощью `bcrypt.hash`.
    *   **`updateUser(id: string, data: object)`**: Обновляет существующие данные пользователя. Если в объекте `data` присутствует новый пароль, он также будет хеширован перед сохранением.
    *   **`updateProfile(userId: string, data: object)`**: Обновляет данные профиля конкретного пользователя, включая возможность сохранения бинарных данных аватара и его типа.
    *   **`initializeRoles()`**: Функция для первоначальной настройки системы. Создает или обновляет (upsert) базовые роли пользователей (например, ADMIN, COACH, PLAYER), если они еще не существуют в базе данных.

5.  **`lib/utils/avatar.ts`**: ([Файл](lib/utils/avatar.ts))
    *   Содержит утилиты для обработки изображений аватаров.
    *   **`encodeAvatar(base64String: string)`**: Принимает строку в формате base64 (обычно это изображение, загруженное с клиента), извлекает из нее бинарные данные и тип изображения, а затем возвращает объект вида `{ data: Buffer, type: string }`.
    *   **`binaryToImageUrl(data: any, mimeType: string)`**: Ключевая функция для отображения аватаров. Преобразует бинарные данные аватара, которые могут храниться в базе данных в различных форматах (например, `Buffer` из Node.js, `Uint8Array`, или специфичный для Prisma тип `PrismaBytes`), в строку Data URL (`data:image/png;base64,...`). Эта строка может быть напрямую использована в атрибуте `src` тега `<img>` на клиенте.
    *   **`decodeAvatar(avatarData: AvatarData | null | undefined)`**: Является удобной оберткой над `binaryToImageUrl`, специально предназначенной для работы с объектом `AvatarData`.

6.  **`middleware.ts`**: ([Файл](middleware.ts))
    *   **Next.js Edge Middleware**: Этот файл определяет middleware, которое выполняется на "границе" (Edge) перед тем, как запрос достигнет основного серверного кода. В данном случае, он сконфигурирован для применения ко всем маршрутам, начинающимся с `/api/:path*`. Несмотря на то, что сама функция `middleware` в этом коде просто передает запрос дальше (`NextResponse.next()`), само ее наличие и применение к API маршрутам может влиять на их поведение, например, принудительно делая их динамическими и предотвращая статическую генерацию.

7.  **`scripts/init-db.ts`**: ([Файл](scripts/init-db.ts))
    *   **Скрипт инициализации базы данных**: Предназначен для выполнения из командной строки (например, через `ts-node`). Он последовательно выполняет две команды Prisma: `npx prisma migrate deploy` для применения всех существующих миграций к схеме базы данных и `npx prisma db seed` для запуска скрипта заполнения базы данных начальными данными (сидинга).

8.  **`prisma/seed.ts`**: ([Файл](prisma/seed.ts))
    *   **Скрипт сидинга базы данных**: Заполняет базу данных начальным набором данных, необходимым для работы или тестирования приложения. Это включает создание предопределенных ролей (ADMIN, COACH, PLAYER), учетной записи администратора, нескольких тренеров, команд, а также генерацию большого количества тестовых игроков с их профилями и связями с командами. Пароли пользователей при создании хешируются.

9.  **`scripts/generate-player-stats.ts`**: ([Файл](scripts/generate-player-stats.ts))
    *   **`generatePlayerStats()`**: Вспомогательная функция, которая генерирует случайный, но правдоподобный набор статистических показателей для одного баскетбольного матча (например, очки, подборы, передачи).
    *   **`main()`**: Основная функция скрипта. Она получает всех игроков из базы данных, затем для каждого игрока находит все матчи, в которых он участвовал. После этого для каждой пары "игрок-матч" генерируется или обновляется (если уже существует) запись в таблице `PlayerStat` с использованием данных от `generatePlayerStats()`. Используется для наполнения БД тестовой статистикой.

10. **API эндпоинты для панели администратора (расположены в `app/api/admin/dashboard/`)**
    *   **`app/api/admin/dashboard/stats/route.ts`** ([Файл](app/api/admin/dashboard/stats/route.ts)): Обрабатывает GET-запросы. Возвращает агрегированную статистику, такую как общее количество команд, игроков, тренеров и число предстоящих событий. Доступен только администраторам.
    *   **`app/api/admin/dashboard/events/route.ts`** ([Файл](app/api/admin/dashboard/events/route.ts)): Обрабатывает GET-запросы. Возвращает список ближайших (на будущее) событий с их деталями (название, тип, время, место, участвующие команды). Доступен только администраторам.
    *   **`app/api/admin/dashboard/charts/route.ts`** ([Файл](app/api/admin/dashboard/charts/route.ts)): Обрабатывает GET-запросы. Собирает и подготавливает данные из различных таблиц базы данных для построения нескольких графиков на главной странице панели администратора. Это включает статистику матчей по командам (победы/поражения/ничьи), распределение количества игроков по командам и количество предстоящих событий (тренировок, матчей, собраний) по месяцам. Доступен только администраторам.

11. **API эндпоинты для управления пользователями (CRUD операции)**
    *   **`app/api/users/route.ts`** ([Файл](app/api/users/route.ts)):
        *   **`GET`**: Получает список всех пользователей. Поддерживает фильтрацию по роли, статусу активности и поисковый запрос по имени/email. Доступен только администраторам. Пароли пользователей исключаются из ответа.
        *   **`POST`**: Создает нового пользователя. Принимает данные пользователя, включая информацию для профиля, и, опционально, специфичные данные для игрока или тренера. Пароль хешируется. Доступен только администраторам.
    *   **`app/api/users/[id]/route.ts`** ([Файл](app/api/users/[id]/route.ts)):
        *   **`GET`**: Получает детальную информацию о конкретном пользователе по его ID. Администратор может запросить любого пользователя; обычный пользователь может запросить только свой собственный профиль. Пароль исключается.
        *   **`PUT`**: Обновляет данные существующего пользователя. Администратор может обновлять любого пользователя; обычный пользователь — только свои данные. При обновлении email проверяется его уникальность. Пароль хешируется при изменении.
        *   **`PATCH`**: Частичное обновление данных пользователя. Позволяет изменять отдельные поля, например, статус активности (`isActive`). Логика доступа аналогична PUT.
        *   **`DELETE`**: Удаляет пользователя по ID. Доступно только администраторам.
    *   **`app/api/users/avatar/route.ts`** ([Файл](app/api/users/avatar/route.ts)):
        *   **`POST`**: Обрабатывает загрузку файла аватара для текущего авторизованного пользователя. Файл проверяется на тип и размер, затем сохраняется в базу данных (вероятно, в поле типа `bytea` или аналогичном для бинарных данных) вместе с его MIME-типом.
        *   **`DELETE`**: Удаляет аватар текущего авторизованного пользователя, устанавливая соответствующие поля в базе данных в `NULL`.

12. **`app/api/roles/route.ts`**: ([Файл](app/api/roles/route.ts))
    *   **`GET`**: Возвращает список всех доступных ролей пользователей из базы данных. Доступно для всех авторизованных пользователей (используется, например, в формах создания/редактирования пользователя для выбора роли).

### Клиентские скрипты (ключевые компоненты React)

1.  **`app/layout.tsx` (RootLayout)**: ([Файл](app/layout.tsx))
    *   **Корневой макет приложения**: Оборачивает все страницы. Асинхронно получает сессию пользователя на сервере (`getServerSession`) и передает ее клиентскому компоненту `SessionProvider`. Подключает глобальные стили и компонент `<Toaster />` для отображения уведомлений. Установлена опция `dynamic = "force-dynamic"`, что означает динамический рендеринг этого макета на сервере при каждом запросе.

2.  **`app/page.tsx` (HomePage)**: ([Файл](app/page.tsx))
    *   **Главная (стартовая) страница приложения**: Использует хук `useSession` для проверки статуса аутентификации пользователя. Если пользователь не аутентифицирован, перенаправляет его на страницу входа (`/auth/login`). Если аутентифицирован, перенаправляет на соответствующую "домашнюю" страницу в зависимости от его роли (например, `/admin` для администратора). Во время проверок отображает индикатор загрузки.

3.  **`components/providers/SessionProvider.tsx`**: ([Файл](components/providers/SessionProvider.tsx))
    *   **Провайдер сессии NextAuth**: Клиентский компонент, который использует `NextAuthSessionProvider` из `next-auth/react` для предоставления данных сессии всем дочерним компонентам через React Context. Это позволяет легко получать доступ к информации о сессии в любом клиентском компоненте с помощью хука `useSession`.

4.  **`components/layout/RoleProtectedLayout.tsx`**: ([Файл](components/layout/RoleProtectedLayout.tsx))
    *   **Макет для защиты маршрутов по ролям**: Клиентский компонент-обертка. Проверяет, аутентифицирован ли пользователь и имеет ли он одну из ролей, указанных в `allowedRoles`. Если доступ запрещен, пользователь перенаправляется (например, на страницу входа или на свою "домашнюю" страницу). Если доступ разрешен, отображает дочерние компоненты, обернутые в `DashboardLayout`.

5.  **`components/layout/DashboardLayout.tsx`**: ([Файл](components/layout/DashboardLayout.tsx))
    *   **Основной макет панели управления**: Формирует визуальную структуру для внутренних страниц приложения (админка, кабинет тренера/игрока). Включает адаптивную боковую навигационную панель (меню которой меняется в зависимости от роли пользователя) и верхнюю панель (header) с именем пользователя, его аватаром и кнопкой выхода. Аватар пользователя отображается с использованием данных из сессии и функции `binaryToImageUrl` для конвертации, если это необходимо.

6.  **`components/profile/ProfileView.tsx`**: ([Файл](components/profile/ProfileView.tsx))
    *   **Компонент просмотра профиля**: Отображает детальную информацию о профиле пользователя. Включает отображение аватара (используя `binaryToImageUrl`), основной информации (имя, email, статус), а также специфических данных в зависимости от роли пользователя (например, позиция и номер для игрока, специализация для тренера).

7.  **`components/profile/ProfileEdit.tsx`**: ([Файл](components/profile/ProfileEdit.tsx))
    *   **Компонент редактирования профиля**: Предоставляет форму для изменения данных профиля пользователя. Позволяет загружать новый аватар или удалять текущий (взаимодействуя с API `/api/users/avatar`). Обновление остальных данных профиля происходит через функцию `onSave`, передаваемую в пропсах, которая обычно вызывает соответствующий API-эндпоинт.

8.  **`app/admin/page.tsx` (AdminDashboard)**: ([Файл](app/admin/page.tsx))
    *   **Главная страница панели администратора**: Отображает сводную информацию для администратора. Асинхронно загружает данные (общую статистику, список ближайших событий, данные для графиков) с нескольких API-эндпоинтов (`/api/admin/dashboard/*`). Использует UI-компоненты, такие как `Card` для статистики, `Table` для событий и компоненты `BarChart`, `PieChart`, `LineChart` для визуализации данных.

9.  **`app/admin/users/page.tsx` (UsersManagementPage)**: ([Файл](app/admin/users/page.tsx))
    *   **Страница управления пользователями (админка)**: Отображает список всех пользователей в системе с возможностями поиска, фильтрации (по роли, статусу) и сортировки. Реализована пагинация для удобной навигации по большому списку. Предоставляет интерфейс для удаления пользователей и перехода к их редактированию или созданию нового. Взаимодействует с API `/api/users` (для получения списка и удаления) и синхронизирует параметры фильтрации/сортировки/пагинации с URL для возможности делиться ссылками и сохранения состояния.

10. **`app/admin/users/create/page.tsx` (CreateUserPage)**: ([Файл](app/admin/users/create/page.tsx))
    *   **Страница создания нового пользователя (админка)**: Содержит форму для ввода всех необходимых данных нового пользователя. Включает клиентскую валидацию полей. Список доступных ролей загружается с сервера (`/api/roles`). При отправке формы данные посылаются на API-эндпоинт `/api/users` методом POST.

11. **`app/admin/users/[id]/edit/page.tsx` (EditUserPage)**: ([Файл](app/admin/users/[id]/edit/page.tsx))
    *   **Страница редактирования пользователя (админка)**: Предназначена для изменения данных существующего пользователя. При загрузке страницы данные пользователя запрашиваются с API (`/api/users/[id]`). Форма позволяет изменять все доступные поля, включая специфичные для роли (игрок/тренер). Обновленные данные отправляются на тот же API-эндпоинт методом PUT.
