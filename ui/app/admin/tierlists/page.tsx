import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { fetchAdminSession, fetchAdminTierlists } from "@/lib/admin-api.js";
import { getAdminSessionTokenFromCookie } from "@/lib/admin-auth.js";
import styles from "../admin.module.css";

type AdminTierlist = {
  creatorType: "authenticated" | "anonymous";
  creator: { id: number; displayName: string } | null;
  publication: {
    id: number;
    publicId: string | null;
    authorName: string | null;
    publishedAt: string | null;
    editedAt: string | null;
    sourceStatsDate: string | null;
  };
};

function formatDate(value: string | null) {
  if (!value) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" })
    .format(new Date(value));
}

export default async function AdminTierlistsPage() {
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  const session = await fetchAdminSession(sessionToken, process.env);
  if (!session) redirect("/admin/login");

  const roleSet = new Set(Array.isArray(session.roles) ? session.roles : []);
  if (!roleSet.has("owner") && !roleSet.has("admin")) redirect("/admin?error=forbidden");

  const tierlists = (await fetchAdminTierlists(sessionToken, process.env)) as AdminTierlist[];

  return (
    <AdminShell activeSection="tierlists" canManageAccess={roleSet.has("owner")}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.sectionEyebrow}>Admin</div>
            <h2 className={styles.panelTitle}>Все тирлисты</h2>
            <p className={styles.cardText}>Публичные тирлисты гостей и авторизованных пользователей.</p>
          </div>
          <div className={styles.profileIdentity}>
            <span className={styles.identityName}>Всего</span>
            <span className={styles.identityMeta}>{tierlists.length}</span>
          </div>
        </div>

        <div className={styles.tierlistAdminGrid}>
          {tierlists.map(({ publication, creator, creatorType }) => (
            <article key={publication.publicId || publication.id} className={styles.subcard}>
              <div className={styles.tierlistAdminHead}>
                <div>
                  <h3 className={styles.cardTitle}>{publication.authorName || "Автор тирлиста"}</h3>
                  <p className={styles.cardText}>Публикация #{publication.id}</p>
                </div>
                <span className={creatorType === "authenticated" ? styles.roleChip : styles.roleChipBase}>
                  {creatorType === "authenticated" ? "Авторизован" : "Гость"}
                </span>
              </div>

              {creator ? (
                <div className={styles.notice}>
                  Создатель: <strong>{creator.displayName}</strong> · User #{creator.id}
                </div>
              ) : (
                <p className={styles.selectedUserMeta}>Создан без входа в аккаунт</p>
              )}

              <div className={styles.tierlistAdminMeta}>
                <span>Опубликован: {formatDate(publication.publishedAt)}</span>
                <span>Срез статистики: {publication.sourceStatsDate || "не указан"}</span>
              </div>

              {publication.publicId ? (
                <Link className={styles.button} href={`/tierlists/${publication.publicId}`}>
                  Открыть тирлист
                </Link>
              ) : null}
            </article>
          ))}
          {!tierlists.length ? <p className={styles.emptyText}>Тирлистов пока нет.</p> : null}
        </div>
      </section>
    </AdminShell>
  );
}
