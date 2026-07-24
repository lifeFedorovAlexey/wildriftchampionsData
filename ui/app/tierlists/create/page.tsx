import TopPillLink from "@/components/TopPillLink";
import { fetchPublicTierlistEditor } from "@/lib/streamer-tierlists-api";
import { loadWinratesPageData } from "@/app/winrates/load-winrates-page.js";
import StreamerTierlistEditor from "@/app/me/streamer/StreamerTierlistEditor";
import styles from "@/app/me/streamer/streamer.module.css";

export default async function CreateTierlistPage() {
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
              Без регистрации. Опубликуй тирлист и поделись прямой ссылкой.
            </p>
          </div>

          <div className={styles.headActions}>
            <TopPillLink href="/streamers">Тирлисты стримеров</TopPillLink>
          </div>
        </div>

        {loadError ? <div className={styles.noticeError}>{loadError}</div> : null}

        {initialData ? (
          <StreamerTierlistEditor
            initialData={initialData}
            publishTarget="public"
            winratesSnapshot={winratesSnapshot}
          />
        ) : null}
      </section>
    </div>
  );
}
