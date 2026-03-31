import WinratesClient from "./WinratesClient";
import { loadWinratesPageData } from "./load-winrates-page.js";

export const revalidate = 60;

export default async function Page() {
  const { rowsBySlice, maxRowCount, error, updatedAt } =
    await loadWinratesPageData("ru_ru", revalidate);

  return (
    <WinratesClient
      rowsBySlice={rowsBySlice}
      maxRowCount={maxRowCount}
      error={error}
      updatedAt={updatedAt}
    />
  );
}
