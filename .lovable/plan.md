
## Что делаем

Добавим раздел `/admin` в этом же приложении. Вход — через официальный Telegram Login Widget. Пускаем только тех, чей `@username` вы добавили в белый список. В админке — CRUD по товарам и переключатель «в наличии / нет». Каталог на главной начнёт подтягиваться из базы, а не из хардкод-файла.

## Что понадобится от вас (в момент реализации)

1. **Бот в Telegram для входа.** Создаётся у @BotFather (`/newbot`). Нужен:
   - Bot Token (секрет вида `123456:ABC-...`) — сохраним как `TELEGRAM_LOGIN_BOT_TOKEN`. Это отдельный токен от того, что уже подключён через коннектор — коннекторный ключ не подходит для проверки подписи виджета.
   - Bot username (например `LovaVapeAdminBot`).
   - В @BotFather выполнить `/setdomain` и указать домен, где будет доступна админка (сейчас `teenvape-vibes.lovable.app`, потом при желании ваш кастомный домен).
2. **Ваш `@username` в Telegram** — чтобы вы точно попали в белый список при первой раскатке. Дальше добавлять/удалять других сможете прямо в админке.

## Как будет работать вход

```text
[Кнопка "Log in with Telegram"] → Telegram Widget возвращает {id, username, hash}
     ↓
серверная функция проверяет hash секретом бота (HMAC-SHA256)
     ↓
проверяем, есть ли username в таблице admin_telegram_users
     ↓
да → создаём/находим пользователя в Lovable Cloud Auth (email вида tg_<id>@lovavape.local),
     выдаём роль admin, возвращаем сессию → редирект на /admin
нет → показываем «доступ запрещён»
```

Пароль этого технического аккаунта — детерминированный, генерится на сервере из вашего секрета + telegram id, наружу не отдаётся. Пользователь никогда его не видит, кнопка входа только одна — «через Telegram».

## Что появится в базе

- `products` — сам каталог (name, brand, category, price, flavor, puffs, volume, image_url, emoji, color, in_stock, sort_order, created_at, updated_at). RLS: читать могут все (публичная витрина), писать — только admin.
- `admin_telegram_users` — белый список: `telegram_username`, `telegram_id` (заполняется при первом входе), `added_by`, `created_at`. Управляется только админом.
- Роль `admin` в существующей таблице `user_roles` присваивается автоматически при первом успешном входе по Telegram, если username в белом списке.
- Одноразовый сид: перенесём текущие товары из `src/lib/products.ts` в таблицу `products`, чтобы витрина не опустела.

## Что появится в интерфейсе

- `/admin/login` — публичная страница с Telegram Login Widget.
- `/admin` (защищено ролью admin) — список товаров с поиском/фильтром по категории, кнопки «Добавить», «Редактировать», «Удалить», переключатель «в наличии».
- `/admin/users` — список разрешённых `@username`, добавить/удалить.
- Главная витрина `/` — начнёт брать товары из `products` вместо хардкод-файла, с учётом `in_stock` (нет в наличии = серым и без «В корзину», либо скрыто — уточним ближе к делу, по умолчанию покажем серым).

## Что НЕ трогаем

- Логику приёма заказов и отправки в Telegram — работает как есть.
- Дизайн главной страницы — только источник данных для карточек товаров.

## Технические детали (для протокола)

- Стек: TanStack Start + Lovable Cloud (Supabase). Проверка виджета и все админские мутации — через `createServerFn` с `requireSupabaseAuth` и проверкой `has_role('admin')`.
- Секреты: `TELEGRAM_LOGIN_BOT_TOKEN` (bot token), `TELEGRAM_LOGIN_BOT_USERNAME` (публичный, для рендера виджета), `ADMIN_PASSWORD_SEED` (сгенерируем автоматически — используется только на сервере для детерминированного пароля техюзера).
- RLS: `products` SELECT `TO anon, authenticated`, ALL — только `has_role(auth.uid(),'admin')`. `admin_telegram_users` — только admin.
- Telegram Login Widget подключается через `<script async src="https://telegram.org/js/telegram-widget.js?22">`, домен обязан совпадать с `/setdomain`.
- Существующий флоу с `TELEGRAM_API_KEY` (коннектор) для уведомлений о заказах не меняется — это другой канал.

## Порядок работ

1. Задать вопросы про бота/username и сохранить `TELEGRAM_LOGIN_BOT_TOKEN` и `TELEGRAM_LOGIN_BOT_USERNAME`.
2. Миграция БД: таблицы `products`, `admin_telegram_users`, гранты, RLS, сид товарами, ваш username в белый список.
3. Серверные функции: `telegramLogin`, `listProducts`, `upsertProduct`, `deleteProduct`, `toggleInStock`, `listAdminUsers`, `addAdminUser`, `removeAdminUser`.
4. Роуты `/admin/login`, `/_authenticated/admin`, `/_authenticated/admin/users` и UI.
5. Переключить главную витрину на чтение из `products`.
6. Проверить: логин по Telegram → добавление/редактирование товара → отображение на главной → отмена входа для чужого username.
