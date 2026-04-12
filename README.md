# My Cloud – Облачное хранилище

## Что это
Веб-приложение "Облачное хранилище", реализующее:
- регистрацию и аутентификацию пользователей;
- админку для управления пользователями и их правами;
- полный цикл управления файлами: загрузку, просмотр списка, скачивание, удаление, переименование, редактирование комментария, генерацию обезличенных ссылок для внешнего доступа.

## Стек технологий
- **Backend**: Python 3.10+ / Django 6.0+ / Django REST Framework, база данных **PostgreSQL**.
- **Frontend**: React 18+ / Redux Toolkit / React Router.
- **Хранение файлов**: локальный диск сервера в директории, указанной в `MEDIA_ROOT`.

## Структура репозитория
- `mycloud/` — Django-бэкенд (API + отдача фронтенда).
- `frontend/` — React-фронтенд.
- `requirements.txt` — зависимости Python.
- `.env.example` — шаблон файла переменных окружения.

## Подготовка и запуск (для reg.ru и аналогичных хостингов)

### 1. Подготовка сервера и базы данных

1.  **Установите PostgreSQL** на вашем сервере (если не установлено).
    -   Для Debian/Ubuntu: `sudo apt update && sudo apt install postgresql postgresql-contrib`
2.  **Настройте пользователя и базу данных** для приложения.
    -   Переключитесь на пользователя `postgres`: `sudo -u postgres psql`
    -   Выполните команды в psql:
        ```sql
        CREATE USER mycloud_nick WITH PASSWORD 'ваш_надежный_пароль';
        CREATE DATABASE mycloud_nick OWNER mycloud_nick;
        GRANT ALL PRIVILEGES ON DATABASE mycloud_nick TO mycloud_nick;
        \q
        ```
    -   Замените `ваш_надежный_пароль` на сгенерированный пароль.
3.  **Убедитесь, что PostgreSQL слушает внешние подключения** (если нужно), отредактировав `postgresql.conf` и `pg_hba.conf`.

### 2. Настройка окружения

1.  Склонируйте репозиторий в директорию вашего сайта.
2.  Создайте виртуальное окружение:
    ```bash
    python -m venv env
    source env/bin/activate
    ```
3.  Установите зависимости:
    ```bash
    pip install -r requirements.txt
    ```
4.  Скопируйте шаблон `.env.example` в файл `.env`:
    ```bash
    cp .env.example .env
    ```
5.  Отредактируйте файл `.env`, заменив значения переменных на свои:
    ```ini
    # Обязательно измените!
    DJANGO_SECRET_KEY=сгенерированный_секретный_ключ_длиной_50_символов
    DB_PASSWORD=ваш_надежный_пароль
    DJANGO_ADMIN_PASSWORD=надежный_пароль_для_админа
    DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,cloud.reg.ru,194.67.122.61
    ```

### 3. Сборка и настройка фронтенда

1.  Перейдите в директорию `frontend`:
    ```bash
    cd frontend
    ```
2.  Установите зависимости:
    ```bash
    npm install
    ```
3.  Настройте переменные окружения для фронтенда. Создайте файл `frontend/.env` со следующим содержимым:
    ```env
    REACT_APP_API_BASE=/api
    ```
4.  Соберите фронтенд для production:
    ```bash
    npm run build
    ```

### 4. Настройка и миграция Django

1.  Вернитесь в директорию `mycloud`:
    ```bash
    cd mycloud
    ```
2.  Примените миграции базы данных:
    ```bash
    python manage.py migrate
    ```
3.  Соберите статические файлы (CSS, JS):
    ```bash
    python manage.py collectstatic --noinput
    ```
4.  Создайте суперпользователя. Скрипт `create_admin` использует переменные из `.env`:
    ```bash
    python manage.py create_admin
    ```
    Убедитесь, что переменные `DJANGO_ADMIN_USERNAME` и `DJANGO_ADMIN_PASSWORD` в `.env` заданы.

### 5. Запуск сервера

Для production-окружения **не используйте** `runserver`. Настройте WSGI-сервер, например, Gunicorn:

```bash
# Установите gunicorn
pip install gunicorn

# Запустите сервер
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### 6. Настройка веб-сервера (Nginx)

Настройте Nginx как обратный прокси, чтобы он перенаправлял запросы на Gunicorn и отдавал статические/медиа файлы напрямую.

Пример конфигурации Nginx (`/etc/nginx/sites-available/mycloud`):
```nginx
server {
    listen 80;
    server_name ваш_домен.ru;

    location / {
        include proxy_params;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /путь/к/вашему/проекту/mycloud/staticfiles/;
    }

    location /media/ {
        alias /путь/к/вашему/проекту/mycloud/media/;
    }
}
```

Активируйте конфигурацию и перезапустите Nginx.

## Устранение неполадок

- **Проблема: `psycopg2` не устанавливается.**
  **Решение:** Убедитесь, что установлены системные зависимости: `sudo apt install libpq-dev python3-dev`.

- **Проблема: Ошибка при миграции, связь с БД.**
  **Решение:** Проверьте правильность настроек `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` в файле `.env`. Убедитесь, что PostgreSQL запущен и принимает подключения.

- **Проблема: Не отображаются статические файлы.**
  **Решение:** Убедитесь, что выполнена команда `collectstatic` и в конфигурации Nginx правильно указан путь к `staticfiles`.

- **Проблема: CORS-ошибки.**
  **Решение:** Убедитесь, что `CSRF_TRUSTED_ORIGINS` в `.env` содержит ваш фронтенд-домен (например, `http://ваш_домен.ru`).

## Документация API

Базовый URL: `/api`

### Аутентификация
- `POST /auth/register/` - Регистрация нового пользователя.
- `POST /auth/login/` - Вход пользователя. Устанавливает сессию.
- `POST /auth/logout/` - Выход пользователя.
- `GET /auth/me/` - Получение данных текущего пользователя.

### Файлы
- `GET /files/` - Получить список файлов (с фильтрацией по `user_id` для админов).
- `POST /files/upload/` - Загрузить файл.
- `DELETE /files/{id}/` - Удалить файл.
- `PATCH /files/{id}/` - Обновить имя или комментарий файла.
- `GET /files/{id}/download/` - Скачать файл.
- `GET /files/{id}/link/` - Получить обезличенную ссылку для скачивания.
- `GET /files/public/{link}/download/` - Скачать файл по обезличенной ссылке.

### Пользователи (только для админов)
- `GET /users/` - Получить список всех пользователей (с пагинацией).
- `PATCH /users/{id}/` - Обновить права пользователя (админ/не админ).
- `DELETE /users/{id}/` - Удалить пользователя.

## Безопасность
- Используется встроенная сессионная аутентификация Django и CSRF-токены.
- Все пароли хранятся в виде хешей.
- Для production обязательно используйте `DEBUG=False` и надежный `SECRET_KEY`.
- Переменные окружения, содержащие пароли и ключи, не должны попадать в систему контроля версий.

