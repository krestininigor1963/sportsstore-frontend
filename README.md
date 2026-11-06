# iSportsStore Frontend (Next.js)

Фронтенд магазина на [Next.js](https://nextjs.org) (App Router) + React 19.
Бэкенд (Express) работает отдельно и подключается по [`API_BASE_URL`](src/lib/api.ts:5).

## Getting Started

Склонируйте репозиторий, установите зависимости и задайте переменные окружения:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
```

Запуск dev-сервера:

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Deploy on Vercel

Проект полностью совместим с Vercel. Пошаговая инструкция:

### 1. Требования к бэкенду

Бэкенд (Express) должен быть доступен из интернета по **HTTPS** (например,
через HAProxy или другой обратный прокси — терминирует TLS).
Это обязательное условие: корзина и админ-сессия живут в cookie, а
cross-site cookie (домен Vercel ≠ домен бэкенда) браузер сохраняет только
при `SameSite=None; Secure` — это настроено в конфигурации
`express-session` бэкенда (`sameSite: "none"`, `secure: "auto"`).

Если бэкенд остаётся только на `localhost`, магазин на Vercel будет
отображаться, но корзина и оформление заказа работать не будут.

### 2. Импорт проекта в Vercel

- Задеплойте репозиторий на GitHub/GitLab/Bitbucket.
- На [vercel.com/new](https://vercel.com/new) импортируйте репозиторий,
  указав **Root Directory = `frontend`** (или перенесите только папку
  `frontend` в отдельный репозиторий).
- Framework Preset: **Next.js** (определяется автоматически).
- Build Command / Output — оставьте по умолчанию (`next build`).

### 3. Переменные окружения

В Settings → Environment Variables добавьте:

| Переменная            | Значение                      |
| --------------------- | ----------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com` |

⚠️ `NEXT_PUBLIC_*` подставляется на этапе сборки, поэтому после изменения
значения нужен redeploy (Vercel сделает это автоматически при push).

### 4. Настройка CORS на бэкенде

Добавьте домен Vercel в переменную окружения `CORS_ORIGINS` бэкенда
(список разрешённых origin'ов в `src/server.ts` репозитория бэкенда):

```
CORS_ORIGINS=https://your-project.vercel.app
```

Несколько доменов — через запятую, включая preview-домены Vercel, если нужно.
Также убедитесь, что продакшен-конфиг использует PostgreSQL
(`production.server.config.json`) и `NODE_ENV=production` (включает
`sameSite: "none"` и `trust proxy` для Secure-cookie).

### 5. CLI-вариант (по желанию)

```bash
cd frontend
npx vercel login
npx vercel          # preview-деплой
npx vercel --prod   # production-деплой
```

## Основные ресурсы

- [Next.js Documentation](https://nextjs.org/docs) — документация Next.js.
- [Learn Next.js](https://nextjs.org/learn) — интерактивный учебник.
- [Vercel Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying) — деплой Next.js.
