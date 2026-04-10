import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { fetchAdminAccessUsers, fetchAdminSession } from "@/lib/admin-api.js";
import { getAdminSessionTokenFromCookie } from "@/lib/admin-auth.js";
import styles from "../admin.module.css";

type AccessIdentity = {
  id: number;
  provider?: string;
  providerEmail?: string;
  providerUsername?: string;
  lastLoginAt?: string | null;
};

type AccessUser = {
  siteUserId: number;
  displayName?: string;
  primaryEmail?: string | null;
  status?: string;
  lastLoginAt?: string | null;
  roles?: string[];
  legacyRoles?: string[];
  effectiveRoles?: string[];
  linkedAdminUserId?: number | null;
  hasAccessConflict?: boolean;
  identities?: AccessIdentity[];
};

const ROLE_DEFINITIONS = [
  {
    key: "owner",
    label: "Owner",
    description: "Полный доступ, включая раздачу ролей и owner-only разделы.",
  },
  {
    key: "admin",
    label: "Admin",
    description: "Операционная работа в админке без права менять owner-контур.",
  },
  {
    key: "streamer",
    label: "Streamer",
    description: "Доступ к будущему кабинету стримера и связанным функциям.",
  },
  {
    key: "patron",
    label: "Patron",
    description: "Доступ к разделу мецената и персональным бонусам.",
  },
];

const PERMISSION_ROWS = [
  { title: "Базовый профиль", roles: ["user"], note: "Есть у каждого зарегистрированного пользователя." },
  { title: "Админка", roles: ["owner", "admin"], note: "Текущая приватная зона `/admin`." },
  { title: "Раздача ролей", roles: ["owner"], note: "Страница `/admin/access` и owner-only изменения." },
  { title: "Кабинет стримера", roles: ["owner", "streamer"], note: "Маршрут уже есть, контент пока заглушка." },
  { title: "Кабинет мецената", roles: ["owner", "patron"], note: "Маршрут уже есть, контент пока заглушка." },
];

function normalizeText(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] || "" : value || "").trim();
}

function normalizeRoleList(value: unknown) {
  return Array.isArray(value)
    ? value.map((role) => String(role || "").trim().toLowerCase()).filter(Boolean)
    : [];
}

function buildAccessHref(query: string, userId: number | null, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (userId) params.set("user", String(userId));

  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }

  const queryString = params.toString();
  return `/admin/access${queryString ? `?${queryString}` : ""}`;
}

function filterUsers(users: AccessUser[], query: string) {
  if (!query) return users;

  const needle = query.toLowerCase();
  return users.filter((user) => {
    const haystacks = [
      user.displayName,
      user.primaryEmail,
      ...(Array.isArray(user.identities)
        ? user.identities.flatMap((identity) => [
            identity.provider,
            identity.providerEmail,
            identity.providerUsername,
          ])
        : []),
    ];

    return haystacks.some((value) => String(value || "").toLowerCase().includes(needle));
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Пока не входил";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Пока не входил";

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  const session = await fetchAdminSession(sessionToken, process.env);

  if (!session) {
    redirect("/admin/login");
  }

  const roleSet = new Set(normalizeRoleList(session.roles));
  if (!roleSet.has("owner")) {
    redirect("/admin?error=forbidden");
  }

  const users = (await fetchAdminAccessUsers(sessionToken, process.env)) as AccessUser[];
  const query = normalizeText(params.q);
  const selectedUserId = Number(normalizeText(params.user) || 0) || 0;
  const filteredUsers = filterUsers(users, query);
  const selectedUser =
    filteredUsers.find((user) => user.siteUserId === selectedUserId) ||
    filteredUsers[0] ||
    null;
  const errorText = normalizeText(params.error);
  const updated = normalizeText(params.updated) === "1";

  return (
    <AdminShell activeSection="access" canManageAccess>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.sectionEyebrow}>Owner Only</div>
            <h2 className={styles.panelTitle}>Доступы</h2>
            <p className={styles.cardText}>
              Здесь видны все зарегистрированные пользователи сайта. Роль `user` базовая и
              назначается автоматически, а сверху можно навешивать `owner`, `admin`,
              `streamer` и `patron`.
            </p>
          </div>
          <div className={styles.profileIdentity}>
            <span className={styles.identityName}>Всего пользователей</span>
            <span className={styles.identityMeta}>{users.length}</span>
          </div>
        </div>

        {errorText ? (
          <div className={styles.error}>
            {errorText === "last_owner_required"
              ? "Нельзя снять роль owner у последнего владельца."
              : errorText === "admin_identity_conflict"
                ? "У пользователя обнаружен конфликт старых admin identity. Лучше сначала разрулить его в базе."
                : errorText === "site_user_identities_required"
                  ? "У пользователя нет привязанных identity, поэтому права выдать пока нельзя."
                  : "Не удалось обновить доступы. Попробуй ещё раз."}
          </div>
        ) : null}
        {updated ? (
          <div className={styles.notice}>
            Роли обновлены. Активные admin-сессии этого пользователя автоматически отозваны.
          </div>
        ) : null}

        <div className={styles.accessGrid}>
          <section className={styles.subcard}>
            <div className={styles.subcardHead}>
              <h3 className={styles.cardTitle}>Пользователи</h3>
              <p className={styles.cardText}>
                Поиск по имени, почте или привязанному провайдеру.
              </p>
            </div>

            <form method="get" action="/admin/access" className={styles.searchForm}>
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Найти пользователя"
                className={styles.input}
              />
              <button type="submit" className={styles.button}>Искать</button>
            </form>

            <div className={styles.accessListStack}>
              {filteredUsers.length ? (
                filteredUsers.map((user) => {
                  const isActive = selectedUser?.siteUserId === user.siteUserId;
                  const activeRoles = Array.isArray(user.roles) ? user.roles : [];
                  const legacyRoles = Array.isArray(user.legacyRoles) ? user.legacyRoles : [];

                  return (
                    <Link
                      key={user.siteUserId}
                      href={buildAccessHref(query, user.siteUserId)}
                      className={`${styles.accessUserCard} ${isActive ? styles.accessUserCardActive : ""}`.trim()}
                    >
                      <div className={styles.accessUserHead}>
                        <strong className={styles.identityName}>
                          {user.displayName || user.primaryEmail || `User #${user.siteUserId}`}
                        </strong>
                        <span className={styles.sidebarLinkMeta}>#{user.siteUserId}</span>
                      </div>
                      <div className={styles.identityMeta}>
                        {user.primaryEmail || "Без e-mail"} · {formatDateTime(user.lastLoginAt)}
                      </div>
                      <div className={styles.roleMatrixPills}>
                        <span className={styles.roleChipBase}>user</span>
                        {activeRoles.map((role: string) => (
                          <span key={`${user.siteUserId}-${role}`} className={styles.roleChip}>
                            {role}
                          </span>
                        ))}
                        {legacyRoles.map((role: string) => (
                          <span
                            key={`${user.siteUserId}-legacy-${role}`}
                            className={`${styles.roleChip} ${styles.roleChipMuted}`.trim()}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className={styles.emptyText}>По этому запросу пока ничего не найдено.</p>
              )}
            </div>
          </section>

          <section className={styles.subcard}>
            {selectedUser ? (
              <>
                <div className={styles.subcardHead}>
                  <div>
                    <h3 className={styles.cardTitle}>
                      {selectedUser.displayName ||
                        selectedUser.primaryEmail ||
                        `User #${selectedUser.siteUserId}`}
                    </h3>
                    <p className={styles.cardText}>
                      Последний вход: {formatDateTime(selectedUser.lastLoginAt)}
                    </p>
                  </div>
                  <div className={styles.roleMatrixPills}>
                    <span className={styles.roleChipBase}>user</span>
                    {normalizeRoleList(selectedUser.roles).map((role) => (
                      <span key={`selected-${role}`} className={styles.roleChip}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.accessMetaGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Site user id</span>
                    <span className={styles.statValue}>#{selectedUser.siteUserId}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Провайдеры</span>
                    <span className={styles.statValue}>
                      {Array.isArray(selectedUser.identities) && selectedUser.identities.length
                        ? selectedUser.identities.map((identity) => identity.provider).join(", ")
                        : "Нет"}
                    </span>
                  </div>
                </div>

                <form action="/api/admin/access" method="post" className={styles.roleForm}>
                  <input type="hidden" name="siteUserId" value={selectedUser.siteUserId} />
                  <input type="hidden" name="selectedUserId" value={selectedUser.siteUserId} />
                  <input type="hidden" name="q" value={query} />

                  <div className={styles.roleCardGrid}>
                    {ROLE_DEFINITIONS.map((role) => {
                      const checked = normalizeRoleList(selectedUser.roles).includes(role.key);
                      return (
                        <label key={role.key} className={styles.roleToggleCard}>
                          <input
                            type="checkbox"
                            name="roleKeys"
                            value={role.key}
                            defaultChecked={checked}
                            className={styles.roleCheckbox}
                          />
                          <div className={styles.roleToggleBody}>
                            <span className={styles.roleToggleTitle}>{role.label}</span>
                            <span className={styles.cardText}>{role.description}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {Array.isArray(selectedUser.legacyRoles) && selectedUser.legacyRoles.length ? (
                    <div className={styles.notice}>
                      У пользователя ещё есть legacy-роли: {selectedUser.legacyRoles.join(", ")}.
                      После сохранения останутся только выбранные выше роли.
                    </div>
                  ) : null}

                  {selectedUser.hasAccessConflict ? (
                    <div className={styles.error}>
                      У этого пользователя несколько конфликтующих admin-link по identity.
                      Автообновление ролей лучше не трогать, пока конфликт не разрулен.
                    </div>
                  ) : null}

                  <div className={styles.profileRow}>
                    <button
                      type="submit"
                      className={`${styles.button} ${selectedUser.hasAccessConflict ? styles.buttonDisabled : ""}`.trim()}
                      disabled={Boolean(selectedUser.hasAccessConflict)}
                    >
                      Сохранить роли
                    </button>
                    <Link
                      href={buildAccessHref(query, selectedUser.siteUserId)}
                      className={`${styles.button} ${styles.buttonSecondary}`.trim()}
                    >
                      Сбросить форму
                    </Link>
                  </div>
                </form>

                <div className={styles.providerGrid}>
                  {Array.isArray(selectedUser.identities) && selectedUser.identities.length ? (
                    selectedUser.identities.map((identity) => (
                      <article key={identity.id} className={styles.providerCard}>
                        <div className={styles.providerMeta}>
                          <strong className={styles.providerLabel}>{identity.provider}</strong>
                          <span className={styles.sidebarLinkMeta}>
                            {identity.providerUsername || identity.providerEmail || "без username"}
                          </span>
                        </div>
                        <p className={styles.providerHint}>
                          {identity.providerEmail || "E-mail не указан"} · {formatDateTime(identity.lastLoginAt)}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className={styles.emptyText}>У пользователя пока нет привязанных identity.</p>
                  )}
                </div>
              </>
            ) : (
              <p className={styles.emptyText}>Выбери пользователя слева, чтобы управлять ролями.</p>
            )}
          </section>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.subcardHead}>
          <div>
            <div className={styles.sectionEyebrow}>Permission Matrix</div>
            <h3 className={styles.cardTitle}>Матрица разрешений</h3>
          </div>
          <p className={styles.cardText}>
            Пока это сознательно простая RBAC-модель: базовая роль `user` плюс дополнительные
            флаги доступа.
          </p>
        </div>

        <div className={styles.permissionMatrix}>
          {PERMISSION_ROWS.map((row) => (
            <article key={row.title} className={styles.permissionRow}>
              <div>
                <strong className={styles.identityName}>{row.title}</strong>
                <p className={styles.cardText}>{row.note}</p>
              </div>
              <div className={styles.roleMatrixPills}>
                {row.roles.map((role) =>
                  role === "user" ? (
                    <span key={`${row.title}-${role}`} className={styles.roleChipBase}>
                      {role}
                    </span>
                  ) : (
                    <span key={`${row.title}-${role}`} className={styles.roleChip}>
                      {role}
                    </span>
                  ),
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
