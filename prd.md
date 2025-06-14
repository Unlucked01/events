## Название проекта

Автоматизированная система для организации мероприятий и встреч в сообществе

## Цель проекта

Создание веб-приложения и Telegram-бота для создания, управления и распространения информации о мероприятиях с возможностью уведомлений, подписок и взаимодействия пользователей.

## Технологический стек

* **Frontend**: Next.js + Material UI (MUI)
* **Backend**: FastAPI (Python) с архитектурой MVC
* **База данных**: PostgreSQL
* **Интеграция**: Telegram Bot API, APScheduler (для CRON задач)

## Основной функционал

### 1. Регистрация и авторизация

* Регистрация: username, пароль, телефон, ФИО
* Авторизация по username и паролю
* Выход из аккаунта

### 2. Профиль пользователя

* Просмотр и изменение:

  * Фото профиля
  * Username
  * Пароль
  * Телефон
  * ФИО
* Список созданных мероприятий
* Кнопка "Создать мероприятие"
* Кнопка "Выйти из аккаунта"

### 3. Подписки

* Просмотр:

  * Списка подписчиков
  * Списка подписок
* Поиск пользователей по username или телефону
* Подписка на пользователя

**Механизм подписки:**

* Таблица `subscriptions` содержит пары: подписчик и автор
* При создании мероприятия системой выбираются все `follower_id` из `subscriptions`, где `followed_id = текущий пользователь`
* Эти пользователи заносятся в `invitations`

**Связь:**

* `User.id` -> `Subscription.follower_id` и `Subscription.followed_id`
* `User.id` -> `Invitation.user_id`
* `Event.id` -> `Invitation.event_id`

### 4. Создание мероприятия

* Поля:

  * Название
  * Дата и время
  * Место
  * Описание
  * Фото (много изображений)
  * Список приглашённых (по умолчанию — все подписчики, можно редактировать)
* Кнопка "Опубликовать мероприятие"
* Возможность редактировать, если мероприятие не прошло

### 5. Лента мероприятий

* Список мероприятий от подписок
* Сортировка по дате добавления
* Поиск по названию и дате
* Переход на страницу мероприятия

### 6. Страница мероприятия

* Отображение информации
* Кнопки:

  * "Принять участие"
  * "Редактировать" (для автора)
  * "Удалить" (для автора)
* Список участников
* Комментарии
* Отзывы и оценки после завершения

### 7. Telegram-бот

* Отправка приглашений:

  * Краткая информация
  * Кнопка перехода на сайт

**Механизм массовой рассылки без Kafka/RabbitMQ:**

1. После создания мероприятия выбираются подписчики
2. Создается очередь в памяти (например, список задач отправки)
3. Используется `asyncio.create_task()` или фоновые задачи FastAPI через `BackgroundTasks`
4. Каждому подписчику отправляется сообщение через Telegram Bot API с таймаутом между запросами (например, `asyncio.sleep(0.1)`) для избежания rate-limit
5. TelegramController отвечает за отправку

* Уведомления:

  * О новых мероприятиях от подписок
  * Напоминания за 24 часа до начала (реализуется через cron-задачу)

**CRON-напоминания (через APScheduler):**

* Периодическая задача запускается каждую ночь (или чаще), находит мероприятия, до которых осталось 24 часа
* Из таблицы `event_participants` выбираются участники
* По каждому участнику отправляется уведомление в Telegram через бот
* Также можно отправить повторное напоминание за 1 час до события

---

## Остальной функционал

* **Оценки и отзывы** после участия
* **Поиск мероприятий**
* **Редактирование мероприятий**, если они ещё не прошли
* **Telegram-бот** для уведомлений, подтверждения участия, перехода на сайт

---

Полный PRD включает:

* Бизнес-цель и назначение
* Полный список функций
* Архитектурные решения
* ER-диаграмму
* REST API описание
* Структуру проекта
* Docker/Docker Compose
* Use Cases
* Механизмы взаимодействия
* Cron-уведомления

Проект готов к разработке и документ соответствует требованиям дипломной работы.
