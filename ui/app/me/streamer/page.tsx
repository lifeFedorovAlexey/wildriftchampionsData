import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import TopPillLink from "@/components/TopPillLink";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";
import { fetchAuthenticatedStreamerTierlistEditor } from "@/lib/streamer-tierlists-api";
import { loadWinratesPageData } from "@/app/winrates/load-winrates-page.js";
import StreamerTierlistEditor from "./StreamerTierlistEditor";
import styles from "./streamer.module.css";

export default async function StreamerPage() {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);
  const session = await fetchSiteUserSession(sessionToken, process.env);

  if (!session) redirect("/me");

  const roleSet = new Set(
    Array.isArray(session.roles)
      ? session.roles
          .map((role: string) => String(role || "").trim().toLowerCase())
          .filter(Boolean)
      : [],
  );

  if (!roleSet.has("streamer") && !roleSet.has("owner")) redirect("/me");

  let initialData = null;
  let winratesSnapshot = { rowsBySlice: {}, dates: [] as string[] };
  let loadError = "";

  try {
    const [editorPayload, winratesPayload] = await Promise.all([
      fetchAuthenticatedStreamerTierlistEditor(sessionToken, process.env),
      loadWinratesPageData("ru_ru", 60),
    ]);
    initialData = editorPayload;
    winratesSnapshot = {
      rowsBySlice: winratesPayload.rowsBySlice || {},
      dates: Array.isArray(winratesPayload.dates) ? winratesPayload.dates : [],
    };
  } catch (error) {
    loadError =
      error instanceof Error
        ? `Не удалось загрузить редактор тирлистов: ${error.message}`
        : "Не удалось загрузить редактор тирлистов.";
  }

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>Кабинет стримера</h1>
            <p className={styles.lead}>
              Собери и опубликуй тирлист. Он появится в каталоге подтверждённых стримеров.
            </p>
          </div>

          <div className={styles.headActions}>
            <TopPillLink href="/streamers">Публичные тирлисты</TopPillLink>
            <TopPillLink href="/me">
              <FaArrowLeft aria-hidden="true" /> В профиль
            </TopPillLink>
          </div>
        </div>

        {loadError ? <div className={styles.noticeError}>{loadError}</div> : null}

        {initialData ? (
          <StreamerTierlistEditor
            initialData={initialData}
            publishTarget="authenticated"
            winratesSnapshot={winratesSnapshot}
          />
        ) : null}
      </section>
    </div>
  );
}
