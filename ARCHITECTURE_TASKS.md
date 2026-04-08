# Architecture Fix Tasks

Этот файл ведём как пошаговый чеклист перехода.
После каждого завершённого атомарного шага задача отмечается галочкой, потом стенд проверяется вручную.

## Правила прохода

- один завершённый шаг за раз
- после каждого шага ручная проверка стенда
- без массовых параллельных рефакторингов
- сначала безопасные правки и фиксация контракта, потом runtime-изменения

## Атомарные задачи

- [x] Шаг 1. Зафиксировать текущий набор секретов и env-контрактов в `ui` и `wr-api`, убрать из примеров и README неактуальные или недоведённые ключи (`USER_*`, лишние invented secrets), не меняя runtime-код.
- [x] Шаг 2. Удалить legacy `skins` ingestion path, завязанный на `ui/public/merged`, и убрать связанный API/domain-рудимент после проверки, что клиентская страница и маршрут больше не используются.
- [x] Шаг 3. Спроектировать guide-domain contract: canonical slug namespace, source alias map, merge policy между источниками, правила fallback по отсутствующим данным.
- [x] Шаг 4. Реализовать guide slug normalization layer внутри `wr-api` и покрыть её тестами на консистентные преобразования между внешними source slugs и внутренним canonical slug.
- [x] Шаг 5. Ввести `skip-on-same-hash` для guide import, чтобы при неизменившемся контенте не делать rewrite дочерних таблиц.
- [x] Шаг 6. После стабилизации guide import решить судьбу legacy `champion_guides`: либо удалить таблицу и кодовый хвост, либо явно оставить как временный cache/compatibility слой с документированной ролью.
- [x] Шаг 7. Подготовить вариант разделения `wr-api` на процессы: public API, auth/session, workers/imports. Отдельно описать, как меняются PM2 и deploy pipeline.
- [ ] Шаг 8. Отдельно вернуться к недоделанному `site user` flow: либо довести до отдельной security boundary с `USER_SESSION_SECRET`, либо убрать из активной продовой поверхности.
- [x] Шаг 9. Отдельно вернуться к `news` domain: либо довести импорт и публикацию до рабочего состояния, либо скрыть недоделанную поверхность из основного контракта.

## Внеплановые закрытые фиксы

- [x] Hotfix A. Убрать дубли `RiftGG` на guide detail: сайт отдаёт только последний `dataDate` на каждый `rank + lane`, но история по дням в БД сохраняется.
- [x] Hotfix B. Добавить `slug-warn` наблюдаемость на `404`/alias-miss в guide pipelines и API.
- [x] Hotfix C. Починить item asset pipeline для `RiftGG`: не отдавать donor URL в runtime payload, передавать `S3_*` env в `update-riftgg-cn-stats`, проверять фактическое существование объекта перед `skip`.
- [x] Hotfix D. Починить special item icons (`staff-of-flowing-waters`, `control-ward`, `sweeping-lens`, `warding-totem`, `*-enchant`): добавить fallback с `WildRiftFire` на `RiftGG assets`, дозаливку в S3 и компактный summary-лог по источникам.
- [x] Hotfix E. Убрать браузерный warning по неиспользуемому preload CSS для error boundary: перевести `app/error.tsx` с отдельного `error.module.css` на inline-стили, чтобы Next не генерировал отдельный preload chunk для `_not-found` / `errorStyles`.
- [x] Hotfix F. Убрать accessibility warning `Blocked aria-hidden on an element because its descendant retained focus` в мобильном меню: заменить скрытие overlay через `aria-hidden` на `inert` и возвращать фокус на кнопку меню при закрытии.
- [x] Hotfix G. Довести `Шаг 7` до реальной runtime-реализации: поднять `wr-api-public`, `wr-api-auth` и совместимый `wr-api` gateway как отдельные процессы с обновлённым deploy pipeline.

## Точка контроля после шага 1

- проверить, что стенд поднимается как раньше
- проверить `ui` локально тестами
- убедиться, что никто не решил, будто docs автоматически поменяли secrets на GitHub или на сервере

## Точка контроля после шага 2

- проверить, что `GET /api/health` работает как раньше
- убедиться, что старые `GET /api/skins*` больше не считаются частью активного контракта
- проверить страницы `news`, `guides`, `tierlist`, `winrates`, `admin`

## Точка контроля после шага 3

- согласовать, что canonical guide slug = official Wild Rift slug
- согласовать, что index работает по union-модели от `champions`
- согласовать, что detail для известного чемпиона может быть partial, если один из источников пуст
- использовать [GUIDE_DOMAIN_CONTRACT.md](/d:/wildRiftChampions/GUIDE_DOMAIN_CONTRACT.md) как source of truth для шага 4

## Точка контроля после шага 5

- прогнать `sync-guides` или точечный импорт одного и того же гайда дважды подряд
- убедиться, что второй импорт возвращает `skipped: true` и `reason: same-content-hash`
- проверить, что guide detail на стенде не меняется, а лишний rewrite дочерних таблиц не происходит

## Точка контроля после шага 6

- убедиться, что в коде больше нет runtime-упоминаний `champion_guides`
- убедиться, что список и detail гайдов продолжают работать через `guide_summaries` + `guide_*`
- помнить, что отдельный `DROP TABLE champion_guides` нужен только в тех БД, где она ещё физически существует

## Точка контроля после шага 7

- использовать [PROCESS_SPLIT_PLAN.md](/d:/wildRiftChampions/wr-api/PROCESS_SPLIT_PLAN.md) как source of truth для разрезания `wr-api`
- не менять рантайм до отдельного атомарного switch-over шага
- держать workers/imports вне постоянного PM2 runtime по умолчанию
- после реализации split-а держать внешний контракт на одном порту через gateway, пока внешний reverse proxy не будет переведён на прямой path routing

## Точка контроля после шага 9

- убедиться, что `/news` больше не входит в sitemap и не считается публичной частью UI
- убедиться, что `GET /api/news`, `GET /api/news/:id` и `POST /api/news/import` больше не входят в активный wr-api контракт
- помнить, что schema/setup/news import groundwork оставлен как dormant domain до отдельного product-ready возврата
