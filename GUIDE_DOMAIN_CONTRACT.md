# Guide Domain Contract

Этот документ фиксирует целевую модель guide-domain перед runtime-рефактором.
Он отвечает на 4 вопроса:

- какой slug внутри системы считается каноническим
- как источники маппятся в этот slug namespace
- как данные из разных источников объединяются
- как система должна вести себя, если один из источников ничего не дал

## 1. Текущее состояние

Сейчас guide-domain собран из нескольких частей:

- `guide_summaries` + `guide_*`
  это нормализованный authored guide-слой из `WildRiftFire`
- `riftgg_cn_matchups` + `riftgg_cn_builds` + `riftgg_cn_dictionaries`
  это stats/build слой из `RiftGG CN`
- `champions`
  это общий champion identity/index слой
- `guide_entities`
  это локальный asset/tooltip слой для item/rune/spell/ability/champion сущностей

При этом slug-логика сейчас размазана:

- [ui/shared/guides-shared.js](/d:/wildRiftChampions/ui/shared/guides-shared.js)
- [wr-api/utils/slugRemap.mjs](/d:/wildRiftChampions/wr-api/utils/slugRemap.mjs)
- [ui/scripts/parse-wildriftfire-guide.js](/d:/wildRiftChampions/ui/scripts/parse-wildriftfire-guide.js)
- [wr-api/api/guides-detail.js](/d:/wildRiftChampions/wr-api/api/guides-detail.js)

Из-за этого сейчас нет одного явного source of truth для champion slug contract.

## 2. Canonical Slug Namespace

Решение:

- внутри всей системы guide-domain canonical slug = `official Wild Rift slug`
- это slug, который берётся из официального Wild Rift / Riot champion namespace
- любой source-specific slug считается только alias, но не внутренним идентификатором доменной модели

Примеры:

- `wukong` — canonical
- `monkeyking` — legacy/local alias
- `nunu-willump` — canonical
- `nunu` — legacy/local alias
- `master-yi` — canonical
- `masteryi` — legacy/local alias

Следствие:

- API должен принимать alias на входе временно, но возвращать наружу только canonical slug
- UI должен строить URL, sitemap, internal links и кэш-ключи только на canonical slug
- `guideSummaries.slug`, `guideOfficialMeta.guideSlug`, `guideVariants.guideSlug` и соседние guide-таблицы должны концептуально жить в canonical namespace
- `RiftGG` и legacy/local slugs не должны выходить наружу как основные slug'и guide domain

## 3. Source Alias Map

Нужна одна централизованная slug-модель, а не несколько локальных ремапов.

Целевой контракт alias layer:

- `toCanonicalChampionSlug(source, sourceSlug) -> canonicalSlug | null`
- `getChampionSlugAliases(canonicalSlug) -> string[]`
- `getSourceSlugCandidates(canonicalSlug, source) -> string[]`

Где `source`:

- `riot`
- `wildriftfire`
- `riftgg`
- `legacyLocal`
- `cn`

Правила:

- canonical slug всегда один
- alias list двусторонний, но канонизация всегда однонаправленная: `source slug -> canonical slug`
- никакой runtime-код не должен сам руками знать, что `monkeyking -> wukong`; он должен спрашивать общий alias layer

Минимальный стартовый набор alias-данных можно продолжать держать в коде, но только в одном месте.

Целевой источник alias-данных:

- базовый список champion slug aliases живёт в одном shared-модуле
- `ui` и `wr-api` импортируют его, а не дублируют свои версии
- source-specific dictionary aliases для `RiftGG` rune/spell/item остаются отдельным слоем, потому что это не champion identity, а entity alias resolution

## 4. Merge Policy Between Sources

Guide-domain должен собираться не по принципу “один источник победил”, а по bounded ownership.

### 4.1 Champion identity owner

Источник истины:

- `champions`

Отсюда берутся:

- canonical slug
- display names
- roles
- champion icon identity

### 4.2 Authored guide owner

Источник истины:

- `WildRiftFire` import -> `guide_summaries` + `guide_*`

Отсюда берутся:

- guide summary title/patch/tier/recommendedRole/buildCount
- official block
- abilities
- buildBreakdown
- authored variants
- authored counters/synergies

### 4.3 Stats/build overlay owner

Источник истины:

- `RiftGG CN`

Отсюда берутся:

- `riftgg.availableRanks`
- `riftgg.availableLanes`
- `riftgg.matchups`
- `riftgg.coreItems`
- `riftgg.runes`
- `riftgg.spells`
- `riftgg.dictionaries.*` raw dictionary basis

### 4.4 Asset/tooltip enrichment owner

Источник истины:

- `guide_entities`

Использование:

- если для `RiftGG` dictionary/entity slug найден canonical or aliased local guide entity, берём локальные `imageUrl` / `tooltipImageUrl`
- если enrichment не найден, остаёмся на raw `RiftGG` dictionary payload

То есть merge rule здесь такая:

- data semantics from `RiftGG`
- media/tooltip overrides from `guide_entities`, only when alias resolution succeeded

## 5. Fallback Rules

Это важнейшая часть, потому что пользователь явно хочет покрытие по всем чемпионам, даже если источник неполный.

### 5.1 Guides index

`GET /api/guides` должен концептуально работать по union-модели:

- базовый список чемпионов приходит из `champions`
- authored guide summary подключается, если есть
- available lanes from `RiftGG` подключаются, если есть

Значит:

- чемпион без `WildRiftFire` guide всё равно должен иметь index presence
- чемпион без `RiftGG` всё равно должен иметь index presence
- чемпион без обоих источников всё равно должен быть виден в общем champion-guides каталоге как placeholder

### 5.2 Guide detail

`GET /api/guides/:slug` должен работать по partial-source модели:

- если есть `WildRiftFire`, но нет `RiftGG`:
  возвращаем authored guide detail + `riftgg: null`
- если есть `RiftGG`, но нет `WildRiftFire`:
  возвращаем champion shell + empty authored sections + `riftgg` block
- если есть оба:
  возвращаем merged detail
- если нет ни одного, но чемпион есть в `champions`:
  временно допустим либо `404`, либо explicit placeholder detail, но это надо выбрать один раз и держать консистентно

Решение для дальнейшей реализации:

- index: всегда union by `champions`
- detail: `404` only when champion slug unknown to canonical champion index
- detail for known champion without authored guide:
  возвращает partial payload с `sourceCoverage`

### 5.3 Incoming slug fallback

На входе временно поддерживаем:

- canonical slug
- legacy/local slug
- source alias slug

Но после резолва:

- весь дальнейший pipeline работает только на canonical slug
- весь ответ наружу содержит только canonical slug

## 6. Response Contract Adjustments

Guide detail и summary должны явно нести source coverage.

Целевое поле:

```json
{
  "sourceCoverage": {
    "championIndex": true,
    "wildriftfire": true,
    "riftgg": false
  }
}
```

Это нужно, чтобы:

- UI не гадал по косвенным `null`
- partial guide detail был валидной доменной формой, а не “сломанный ответ”
- merge policy была наблюдаемой

## 7. Migration Rules

До runtime-миграции принимаются такие правила:

1. новые места не создают свои remap-таблицы
2. любое новое alias правило добавляется только в единый guide/champion slug map
3. guide import канонизирует champion slug до записи в `guide_*`
4. `RiftGG` import канонизирует champion slug до записи в `riftgg_cn_*`
5. API на входе резолвит alias -> canonical, на выходе всегда отдаёт canonical

## 8. Что это значит для следующих шагов

### Шаг 4

Реализуем central slug normalization layer.

Минимальный scope:

- один shared slug map module
- `toCanonicalChampionSlug`
- `getChampionSlugAliases`
- перевод `ui` и `wr-api` на этот shared contract

### Шаг 5

Добавляем `skip-on-same-hash` только для authored guide source:

- если `WildRiftFire` contentHash не изменился, authored subtree не переписывается
- `RiftGG` при этом остаётся независимым stats source

### Шаг 6

`champion_guides` не нужен как второй source of truth.

Его можно:

- удалить
- либо временно оставить только как legacy archive/cache, но без активного чтения в guide API

## 9. Явно принятые решения

- canonical guide slug = official Wild Rift slug
- alias support остаётся только как compatibility layer
- `WildRiftFire` owns authored guide content
- `RiftGG` owns stats/build overlay
- `champions` owns champion identity
- `guide_entities` owns local media/tooltip enrichment
- guide index должен покрывать всех чемпионов по union-модели
- guide detail должен поддерживать partial-source payload для известных чемпионов
