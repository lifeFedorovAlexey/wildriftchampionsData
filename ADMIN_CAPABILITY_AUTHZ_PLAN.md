# Admin Capability Authz Plan

Эта задача вынесена из основного архитектурного плана как отдельная будущая фича.
Текущий этап стабилизации `guides + auth + process split` считается завершённым без неё.

## Цель

Перейти от грубой проверки ролей (`owner`, `admin`, `editor`, `viewer`) к capability-based authorization:

- одна роль даёт набор разрешений
- страницы и действия проверяют capability
- доступы описываются не по страницам, а по возможностям

## Почему это отдельная фича

- текущая админка уже рабочая и не требует capability-layer как обязательного условия
- реальная ценность появится, когда начнутся новые private/admin разделы
- внедрение лучше делать сразу целостно, а не кусками по отдельным страницам

## Целевой контракт

Примеры capabilities:

- `view_admin_dashboard`
- `manage_admin_users`
- `manage_roles`
- `edit_guides`
- `manage_private_profiles`
- `publish_news`

Роли становятся просто группировкой capability-наборов.

Пример:

- `owner` -> все capabilities
- `admin` -> operational capabilities без полного управления ролями
- `editor` -> content capabilities
- `viewer` -> read-only capabilities

## План реализации

- Шаг A. Зафиксировать canonical capability dictionary и mapping `role -> capabilities`.
- Шаг B. Добавить server-side helper `hasCapability(user, capability)` и тесты.
- Шаг C. Перевести существующие admin checks с role-based условий на capability-based.
- Шаг D. Разделить доступ к будущим admin страницам и действиям через capabilities, а не через page-based rules.
- Шаг E. Добавить в админку управление ролями и capability-наборами.
- Шаг F. Отдельно решить, нужны ли custom roles или пока остаёмся на фиксированных системных ролях.

## Границы

Что не входит прямо сейчас:

- массовый redesign админки
- кастомный RBAC-конструктор
- миграция всех будущих private user-zones, которых ещё нет

## Definition of Done

- сервер умеет проверять capability отдельно от роли
- роли описаны через capability mapping
- существующие admin actions не проверяют роли напрямую там, где достаточно capabilities
- в админке есть понятный source of truth для управления доступами
