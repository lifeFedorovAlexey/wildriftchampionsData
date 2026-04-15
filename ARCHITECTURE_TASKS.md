# Architecture Status

Этот файл держим отдельно от общего продуктового плана.
Он показывает текущее архитектурное состояние: что уже завершено и что ещё нужно доделать именно на уровне схемы/границ/контрактов.

## Выполнено

### Базовые контуры

- `root repo` используется как frontend / orchestration-контур.
- `wr-api` отделён как основной API и source of truth для данных.
- `wr-chat` вынесен в отдельный repo как отдельный realtime/chat service.

### Guides / domain / import

- Зафиксирован guide-domain contract.
- Введён canonical guide slug normalization layer.
- Добавлен `skip-on-same-hash` для guide import.
- Legacy `news` surface выведен из активного публичного контракта.
- Champion pool стабилизирован на Riot-backed списке.

### Runtime split / auth

- `wr-api` разрезан по runtime-контуру на public/auth/gateway модель.
- User auth доведён до provider-based flow без email/password.
- Public pages не зависят от auth.
- `/me` работает как private user surface.

### Hotfix-слой

- Убраны дубли `RiftGG` по последнему `dataDate` на `rank + lane`.
- Добавлена наблюдаемость по `slug-warn`.
- Доведён item asset pipeline для `RiftGG`.
- Исправлены special item icons и fallback asset flow.
- Убран preload-warning вокруг error boundary.
- Убран mobile menu accessibility warning.
- Process split доведён до реального runtime/deploy контура.

## Необходимо выполнить

### 1. Capability-based authorization

- Уйти от прямых role-checks к capability model для admin/private surfaces.
- Добавить capability dictionary и server-side helper.
- Перевести новые private/admin поверхности на capability checks.

### 2. `wr-chat` как завершённый архитектурный контур

- Довести `wr-chat` до text-chat MVP end-to-end.
- Зафиксировать контракт, где `wr-chat` не пишет business truth напрямую в БД.
- Довести отдельный deploy contour, env contract и reverse proxy под отдельный сервер.

### 3. Importer architecture cleanup

- Разрезать importer-ы на fetch / parse / persist / report слои.
- Вынести Riot enrich в reusable layer.
- Ввести единый structured importer report и structured log format.
- Добавить fixture-based tests на реальные snapshot-ы источников.

### 4. Asset contract cleanup

- Добить S3-first asset contract как единственный production contract.
- Разделить runtime asset cache и import staging flow.
- Убрать legacy proxy/mirror путь из нормального client-facing контракта.

## Направление продвижения

### Ближайшее

- удержать зелёный data sync
- довести `wr-chat` text MVP локально
- после этого довести отдельный deploy contour для `wr-chat`

### После этого

- capability-based admin authz
- importer refactor
- asset contract cleanup

## Отдельные source-of-truth

- [MASTER_PLAN.md](/d:/wildRiftChampions/MASTER_PLAN.md)
  единый приоритетный продуктовый план
- [GUIDE_DOMAIN_CONTRACT.md](/d:/wildRiftChampions/GUIDE_DOMAIN_CONTRACT.md)
  guide-domain contract
