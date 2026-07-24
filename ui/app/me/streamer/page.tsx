import TopPillLink from "@/components/TopPillLink";
import { fetchPublicTierlistEditor } from "@/lib/streamer-tierlists-api";
import { loadWinratesPageData } from "@/app/winrates/load-winrates-page.js";
import StreamerTierlistEditor from "./StreamerTierlistEditor";
import styles from "./streamer.module.css";

export default async function StreamerPage() {
  let initialData = null;
  let winratesSnapshot = { rowsBySlice: {}, dates: [] as string[] };
  let loadError = "";

  try {
    const [editorPayload, winratesPayload] = await Promise.all([
      fetchPublicTierlistEditor(process.env),
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
            <h1 className={styles.title}>Создать тирлист</h1>
            <p className={styles.lead}>
              Доступно без регистрации. Выбери формат, расставь чемпионов и получи публичную ссылку.
            </p>
          </div>

          <div className={styles.headActions}>
            <TopPillLink href="/streamers">Публичные тирлисты</TopPillLink>
            <TopPillLink href="/me">В профиль</TopPillLink>
          </div>
        </div>

        {loadError ? <div className={styles.noticeError}>{loadError}</div> : null}

        {initialData ? (
          <StreamerTierlistEditor
            initialData={initialData}
            winratesSnapshot={winratesSnapshot}
          />
        ) : null}
      </section>
    </div>
  );
}
