# Master Plan

Единый приоритетный план проекта. Этот файл заменяет старые разрозненные roadmap/techdebt/authz/chat-планы.

## Правила

- Работаем от `main`, если не оговорено иное.
- Не держим параллельно несколько конкурирующих roadmap-файлов.
- Сначала доводим текущие живые контуры до рабочего состояния, потом расширяем поверхность.
- Аудио/voice не трогаем, пока текстовый чат не доведён до устойчивого MVP.

## P0. Стабильность прод-данных

Цель: сайт должен стабильно обновляться и соответствовать источникам без ложных падений scheduler-а.

- Держать `Sync All Data` зелёным на `main`.
- Держать `CN history` в режиме атомарной публикации без окна пустоты.
- Следить, чтобы таблица винрейтов брала только корректный текущий completed snapshot.
- Добить фактическую синхронность `RiftGG`-данных с источником, если источник даёт более свежие `dataDate`, чем мы показываем/храним.
- Добавить лёгкую smoke-проверку после sync:
  - `cn-history` импорт завершён
  - нет ложного `exit 1` на warnings
  - публичные endpoints читают актуальный snapshot

## P1. `wr-chat` text MVP

Цель: локально рабочий групповой текстовый чат без аудио.

### `wr-api`

- Добить тесты на:
  - создание группы создаёт `general`
  - пользователь видит только свои группы
  - пользователь не читает чужой канал
  - пользователь не пишет в чужой канал
  - invite accept добавляет в members
  - ban запрещает чтение и запись
- Закрыть локальный smoke `chat` API.

### `wr-chat`

- Оставить `wr-api` source of truth для business data.
- Добить контракт, где `wr-chat` не пишет message truth напрямую в БД.
- Вести realtime только как delivery/presence/socket layer.

### `ui`

- Сделать нормальную страницу `/me/chat`.
- Добавить:
  - список групп
  - список каналов
  - ленту сообщений
  - форму отправки
  - websocket client
- Проверить 2-вкладочный realtime сценарий.

### Definition of Done

- локально подняты `ui`, `wr-api`, `wr-chat`
- логин проходит через текущий user auth
- чат работает в браузере
- 2 вкладки видят realtime
- `lint/test/build` зелёные там, где применимо

## P2. `wr-chat` deploy contour

Цель: отдельный сервер и отдельный CI/CD под чат.

- Для `wr-chat` отдельный CI.
- Для `wr-chat` отдельный deploy workflow.
- Подготовить:
  - production env list
  - systemd или docker compose
  - reverse proxy config
  - healthcheck
  - rollback plan
- Завести отдельный сервер, домен/subdomain и GitHub secrets.
- После этого сделать smoke:
  - `/health`
  - session exchange
  - websocket connect
  - browser smoke с `ui`

## P3. Capability-based admin authz

Цель: уйти от прямых role-checks к capability model.

- Зафиксировать canonical capability dictionary.
- Добавить `hasCapability(user, capability)` на сервере.
- Перевести admin/private checks на capability-based model.
- Довести управление доступами в админке как отдельную feature surface.

## P4. Scraper / importer refactor

Цель: уменьшить хрупкость импортов и упростить сопровождение.

- Вынести fetch / parse / persist / report по модулям.
- Добавить fixture-тесты на реальные HTML/API snapshot-ы.
- Вынести Riot detail-page enrich в отдельный reusable layer.
- Ввести единый structured importer report.
- Ввести единый structured log format для importer-ов.
- Подготовить миграционный план для старых форматов данных.

## P5. Asset / S3 contract debt

Цель: полностью убрать двусмысленность runtime asset policy.

- Уйти от legacy proxy/runtime mirror пути как части публичного client contract.
- Разделить runtime asset cache и import staging/upload flow.
- Держать champion/guide/media assets в явном S3-first contract.
- Добавить API contract tests, что публичные payload-ы не возвращают donor/proxy URL там, где должна быть публичная asset URL.

## Что оставляем отдельными source-of-truth

- [ARCHITECTURE_TASKS.md](/d:/wildRiftChampions/ARCHITECTURE_TASKS.md)
  архитектурное состояние и направление движения
- [GUIDE_DOMAIN_CONTRACT.md](/d:/wildRiftChampions/GUIDE_DOMAIN_CONTRACT.md)
  контракт guide-domain

## Что уже закрыто на текущем этапе

- `guides + auth + process split` стабилизированы как отдельный архитектурный этап
- `wr-chat` вынесен в отдельный repo
- `wr-api` chat foundation уже существует
- snapshot-модель для `CN history` введена
- root и `wr-api` синки/фиксы ведутся через `main`
